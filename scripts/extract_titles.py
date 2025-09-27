#!/usr/bin/env python3
"""
Script simples para extrair apenas título das tasks e suas listas
"""

import json
import sys
import re

def extract_task_titles(filename: str):
    """Extrai apenas os títulos das tasks e suas listas"""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        sys.exit(1)
    
    # Criar mapa de listas
    lists_map = {}
    if 'lists' in data:
        for list_item in data['lists']:
            lists_map[list_item['id']] = list_item['name']
    
    tasks = []
    
    if 'cards' in data:
        for card in data['cards']:
            name = card.get('name', '')
            list_id = card.get('idList', '')
            list_name = lists_map.get(list_id, 'Unknown')
            
            # Pular User Stories (começam com US)
            if re.match(r'^US\d+', name):
                continue
            
            # Pular cards que não são tasks (sem código como ED 002, TP 003, etc.)
            if not re.search(r'→\s*[A-Z]{2,4}\s*\d+', name):
                continue
            
            tasks.append({
                'title': name,
                'list': list_name
            })
    
    return tasks

def main():
    if len(sys.argv) != 2:
        print("Uso: python extract_titles.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    print("🎯 EXTRAINDO TÍTULOS DAS TASKS:")
    print("=" * 80)
    
    tasks = extract_task_titles(filename)
    
    for i, task in enumerate(tasks, 1):
        print(f"{i:2d}. {task['title']}")
        print(f"    📍 Lista: {task['list']}")
        print()
    
    print(f"📊 Total de tasks encontradas: {len(tasks)}")

if __name__ == "__main__":
    main()
