#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os, stat, subprocess, sys, yaml
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
M=ROOT/'manifesto.yaml'
STRUCT=['manifesto.yaml','estado.md','lexico.yaml','competencias.yaml','contratos']

def fail(msg): print('FAIL:',msg); raise SystemExit(1)
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--all',action='store_true'); ap.add_argument('--estado',action='store_true'); args=ap.parse_args()
    if not M.exists(): fail('manifesto.yaml missing')
    m=yaml.safe_load(M.read_text(encoding='utf-8'))
    if m.get('projeto')!='airgap-vault-kaizou': fail('wrong projeto')
    if not isinstance(m.get('versao_contrato'),int): fail('versao_contrato invalid')
    entries=m.get('entradas') or []
    ids=[e.get('id') for e in entries]; paths=[e.get('caminho') for e in entries]
    if len(ids)!=len(set(ids)): fail('duplicate id')
    if len(paths)!=len(set(paths)): fail('duplicate caminho')
    declared=set(paths)
    # declared -> exists, honoring pending/em_curso
    for e in entries:
        p=ROOT/e['caminho']; st=e.get('status')
        if st=='aceito' and not p.exists(): fail(f'accepted entry missing: {e["caminho"]}')
    # five structures present/readable
    for rel in ['manifesto.yaml','estado.md','lexico.yaml','competencias.yaml']:
        p=ROOT/rel
        if not p.is_file(): fail(f'missing structure file: {rel}')
        if not os.access(p,os.R_OK): fail(f'unreadable structure file: {rel}')
    cdir=ROOT/'contratos'
    if not cdir.is_dir(): fail('contratos missing')
    for p in cdir.glob('*.json'):
        try: json.loads(p.read_text(encoding='utf-8'))
        except Exception as ex: fail(f'invalid json contract {p.name}: {ex}')
    # shared block mechanically valid if present
    sh=m.get('trabalho_compartilhado')
    if sh:
        for k in ['projeto','caminho','unidade','descricao','agente','atualizado_em','previsao_termino','zona_exclusao']:
            if k not in sh: fail(f'shared block missing {k}')
        if not isinstance(sh['zona_exclusao'],list): fail('zona_exclusao not list')
        if sh['caminho']!=str(ROOT): fail('shared block wrong path')
    infra=m.get('infraestrutura') or {}
    forbidden={'host_canonico','endereco_host','raiz_projeto'} & set(infra)
    if forbidden: fail(f'machine identity leaked into project infrastructure: {sorted(forbidden)}')
    if infra.get('perfil_requerido')!='work': fail('required environment profile mismatch')
    req=infra.get('requer') or {}; android=req.get('android') or {}
    if req.get('docker') is not True or req.get('kvm') is not True: fail('required Docker/KVM capabilities missing')
    if android.get('api')!=30 or android.get('tag')!='google_apis_playstore' or android.get('abi')!='x86_64': fail('required Android capability mismatch')
    if infra.get('vps')!='ponte_apenas': fail('VPS boundary mismatch')
    if infra.get('workflow_infra')!='externo_residente_fonte_descritiva': fail('workflow-infra source boundary mismatch')
    # project-prefixed generated/control artifacts must all be declared
    for base in [ROOT/'scripts',ROOT/'docs']:
        if base.exists():
            for p in base.glob('airgap-vault-kaizou-*'):
                rel=p.relative_to(ROOT).as_posix()
                if rel not in declared: fail(f'project artifact exists but is undeclared: {rel}')
    # structure files should not be ignored by git
    for rel in ['manifesto.yaml','estado.md','lexico.yaml','competencias.yaml','contratos/solflare-keystone.schema.json']:
        r=subprocess.run(['git','-C',str(ROOT),'check-ignore','-q',rel])
        if r.returncode==0: fail(f'structure ignored by git: {rel}')
    # state contract version must match
    s=(ROOT/'estado.md').read_text(encoding='utf-8')
    if f'contrato v{m["versao_contrato"]}' not in s: fail('estado version mismatch')
    print(f'PASS: structure valid for airgap-vault-kaizou contract v{m["versao_contrato"]}; entries={len(entries)}')
if __name__=='__main__': main()
