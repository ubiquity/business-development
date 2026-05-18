#!/usr/bin/env python3
"""GitHub Bounty Lead Scorer — ranks by engagement delta, not keyword volume."""
import os, sys, json, csv, re, argparse
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.parse import urlencode

GITHUB_API = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS = {"Accept": "application/vnd.github+json", "User-Agent": "ubiquity-lead-scorer/1.0"}
if TOKEN: HEADERS["Authorization"] = f"Bearer {TOKEN}"

def api_get(endpoint, params=None):
    url = f"{GITHUB_API}{endpoint}"
    if params: url += "?" + urlencode(params)
    try:
        with urlopen(Request(url, headers=HEADERS), timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  ⚠ {e}", file=sys.stderr); return None

def search_issues(q, sort="updated", order="desc", per_page=100):
    return api_get("/search/issues", {"q": q, "sort": sort, "order": order, "per_page": per_page})

def get_comments(owner, repo, num, since=None):
    p = {"per_page": 100}
    if since: p["since"] = since.isoformat()
    return api_get(f"/repos/{owner}/{repo}/issues/{num}/comments", p)

def engagement_delta(issue, days=7):
    now = datetime.utcnow()
    since = now - timedelta(days=days)
    parts = issue.get("html_url", "").replace("https://github.com/", "").split("/")
    if len(parts) < 4: return 0, {}
    o, r, num = parts[0], parts[1], int(parts[3])
    cmts = get_comments(o, r, num, since) or []
    ppl = {c.get("user",{}).get("login","") for c in cmts if c.get("user",{}).get("login")}
    rx = issue.get("reactions",{}).get("total_count",0)
    rx_r = int(rx*0.3) if issue.get("updated_at","") > since.isoformat() else 0
    d = len(cmts)*3 + rx_r*2 + len(ppl)*1
    return d, {"c7": len(cmts), "rx": rx_r, "ppl": len(ppl), "rx_t": rx}

def bounty_amt(issue):
    body = (issue.get("body","") or "").lower()
    m = re.findall(r'\$[\d,]+(?:\.\d{2})?', body)
    if m: return m[0]
    for l in issue.get("labels",[]):
        m = re.findall(r'\$[\d,]+', l.get("name","").lower())
        if m: return m[0]
    return "N/A"

def platform(issue):
    body = (issue.get("body","") or "").lower()
    labs = [l.get("name","").lower() for l in issue.get("labels",[])]
    if any("💎" in l or "algora" in l for l in labs): return "Algora"
    if "issuehunt" in body: return "IssueHunt"
    if "polar" in body: return "Polar.sh"
    if "opire" in body: return "Opire"
    if any("bounty" in l or "reward" in l or "💰" in l for l in labs): return "Label"
    return "Custom"

def score(issue, delta, det):
    s = 0
    if delta>=15: s+=5
    elif delta>=10: s+=4
    elif delta>=5: s+=3
    elif delta>=2: s+=2
    elif delta>=1: s+=1
    amt = bounty_amt(issue)
    if amt!="N/A": s+=4
    elif any("bounty" in l.get("name","").lower() for l in issue.get("labels",[])): s+=3
    elif any("reward" in l.get("name","").lower() for l in issue.get("labels",[])): s+=2
    p = platform(issue)
    if p in ("Algora","IssueHunt"): s+=3
    elif p in ("Polar.sh","Opire"): s+=2
    elif p=="Label": s+=1
    u = issue.get("updated_at","")
    if u:
        d = (datetime.utcnow()-datetime.fromisoformat(u.replace("Z",""))).days
        if d<=1: s+=3
        elif d<=3: s+=2
        elif d<=7: s+=1
    rx = issue.get("reactions",{}).get("total_count",0)
    if rx>=10: s+=3
    elif rx>=5: s+=2
    elif rx>=1: s+=1
    labs = [l.get("name","").lower() for l in issue.get("labels",[])]
    if "good first issue" in labs: s+=1
    if "help wanted" in labs: s+=1
    return s

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--output", default="leads.csv")
    a = ap.parse_args()
    cut = (datetime.utcnow()-timedelta(days=90)).strftime("%Y-%m-%d")
    qs = [
        f'label:"💎 Bounty" state:open updated:>{cut}',
        f'"issuehunt" label:bounty state:open updated:>{cut}',
        f'"Price: $" OR "💰" state:open updated:>{cut}',
        f'"funded issue" OR "funded contribution" state:open updated:>{cut}',
        f'"contributor reward" OR "contributor incentive" state:open updated:>{cut}',
        f'label:"good first issue" "bounty" OR "reward" state:open updated:>{cut}',
        f'label:"help wanted" "funded" OR "paid" state:open updated:>{cut}',
        f'commenter:algora-io state:open updated:>{cut}',
    ]
    seen = {}
    for i,q in enumerate(qs):
        t = i//3+1
        print(f"🔍 Tier {t}: {q[:60]}...")
        res = search_issues(q, per_page=min(a.limit,100))
        if not res or "items" not in res: continue
        for it in res["items"]:
            if it["html_url"] not in seen: seen[it["html_url"]] = it
        print(f"   {len(res['items'])} results (unique: {len(seen)})")
    print(f"\n📊 Scoring {len(seen)} issues...")
    leads = []
    for url,it in seen.items():
        d,det = engagement_delta(it, a.days)
        s = score(it,d,det)
        leads.append({"score":s,"delta":d,"url":url,"title":it.get("title","")[:80],
            "repo":"/".join(url.split("/")[3:5]),"platform":platform(it),"amount":bounty_amt(it),
            "c7":det.get("c7",0),"rx":it.get("reactions",{}).get("total_count",0),
            "updated":it.get("updated_at","")[:10],
            "labels":", ".join(l["name"] for l in it.get("labels",[])[:5])})
    leads.sort(key=lambda x:(x["score"],x["delta"]),reverse=True)
    with open(a.output,"w",newline="") as f:
        w=csv.DictWriter(f,fieldnames=["score","delta","url","title","repo","platform","amount","c7","rx","updated","labels"])
        w.writeheader(); w.writerows(leads[:a.limit])
    print(f"\n🏆 Top 10:\n")
    print(f"{'Score':>5} {'Δ':>4} {'Platform':<10} {'Amount':<8} {'Repo':<35} Title")
    print("-"*100)
    for l in leads[:10]:
        print(f"{l['score']:>5} {l['delta']:>4} {l['platform']:<10} {l['amount']:<8} {l['repo']:<35} {l['title'][:45]}")
    print(f"\n✅ {len(leads)} leads → {a.output}")

if __name__=="__main__": main()
