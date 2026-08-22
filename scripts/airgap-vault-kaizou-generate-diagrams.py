#!/usr/bin/env python3
from __future__ import annotations
import argparse, fnmatch, re, sys, yaml
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'manifesto.yaml'
OUT={
 'modules':ROOT/'docs/airgap-vault-kaizou-modules.mmd',
 'deps':ROOT/'docs/airgap-vault-kaizou-dependencies.mmd',
 'flow':ROOT/'docs/airgap-vault-kaizou-flow.mmd',
 'progress':ROOT/'docs/airgap-vault-kaizou-progress.mmd',
 'competences':ROOT/'docs/airgap-vault-kaizou-competences.mmd',
 'concurrency':ROOT/'docs/airgap-vault-kaizou-concurrency.mmd',
}
def nid(i): return f'E{i}'
def esc(v): return str(v).replace('"','&quot;')
def slug(v): return re.sub(r'[^A-Za-z0-9_]', '_', str(v))
def render():
    data=yaml.safe_load(MANIFEST.read_text(encoding='utf-8'))
    es=data['entradas']; producer={e.get('produz'):e for e in es if e.get('produz')}
    bydir=defaultdict(list)
    for e in es: bydir[Path(e['caminho']).parent.as_posix()].append(e)
    out={}
    a=['graph TD']
    for d,items in sorted(bydir.items()):
        sid=slug('root' if d=='.' else d); a.append(f'  subgraph {sid}["{esc(d)}"]')
        for e in items: a.append(f'    {nid(e["id"])}["{esc(Path(e["caminho"]).name)}<br/>{esc(e["proposito"])}"]')
        a.append('  end')
    out['modules']='\n'.join(a)+'\n'
    a=['graph LR']
    for e in es: a.append(f'  {nid(e["id"])}["{esc(e["caminho"])}"]')
    for e in es:
        for token in e.get('consome',[]):
            if token not in producer:
                raise SystemExit(f'FAIL: token sem produtor: {token}')
            a.append(f'  {nid(producer[token]["id"])} -->|"{esc(token)}"| {nid(e["id"])}')
    out['deps']='\n'.join(a)+'\n'
    a=['flowchart TD']
    flows=data.get('fluxos',{})
    if not flows: a.append('  N0["Nenhum fluxo declarado no manifesto"]')
    for name,steps in flows.items():
        a.append(f'  subgraph F_{slug(name)}["{esc(name)}"]'); prev=None
        for idx,step in enumerate(steps):
            node=f'F_{slug(name)}_{idx}'; a.append(f'    {node}["{esc(step)}"]')
            if prev: a.append(f'    {prev} --> {node}')
            prev=node
        a.append('  end')
    out['flow']='\n'.join(a)+'\n'
    a=['graph TD']
    for e in es: a.append(f'  {nid(e["id"])}["{esc(e["caminho"])}"]:::{e["status"]}')
    a += ['  classDef pendente fill:#f3f3f3,stroke:#777','  classDef em_curso fill:#fff3bf,stroke:#8a6d00','  classDef aceito fill:#d3f9d8,stroke:#2b8a3e']
    out['progress']='\n'.join(a)+'\n'
    comps=yaml.safe_load((ROOT/'competencias.yaml').read_text(encoding='utf-8')) or []
    coverage={}
    for c in comps:
        for t in c.get('ativa_em',[]): coverage.setdefault(t,[]).append(c['id'])
    a=['graph TD']
    for e in es:
        cs=', '.join(coverage.get(e['tipo'],[])) or 'sem competência gerativa'
        a.append(f'  {nid(e["id"])}["{esc(e["caminho"])}<br/>tipo={esc(e["tipo"])}<br/>{esc(cs)}"]')
    out['competences']='\n'.join(a)+'\n'
    shared=data.get('trabalho_compartilhado'); zones=shared.get('zona_exclusao',[]) if shared else []
    a=['graph TD']
    for e in es:
        blocked=any(fnmatch.fnmatch(e['caminho'],p) for p in zones); cls='bloqueado' if blocked else 'livre'
        a.append(f'  {nid(e["id"])}["{esc(e["caminho"])}"]:::{cls}')
    a += ['  classDef bloqueado fill:#ffe3e3,stroke:#c92a2a','  classDef livre fill:#f8f9fa,stroke:#868e96']
    out['concurrency']='\n'.join(a)+'\n'
    return out

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); args=ap.parse_args(); rendered=render()
    if args.check:
        bad=[]
        for k,p in OUT.items():
            if not p.exists() or p.read_text(encoding='utf-8') != rendered[k]: bad.append(str(p.relative_to(ROOT)))
        if bad: print('FAIL:', ', '.join(bad)); raise SystemExit(1)
        print('PASS: six diagrams match manifest projection'); return
    for k,p in OUT.items():
        p.parent.mkdir(parents=True,exist_ok=True); p.write_text(rendered[k],encoding='utf-8'); print('WROTE:',p)
if __name__=='__main__': main()
