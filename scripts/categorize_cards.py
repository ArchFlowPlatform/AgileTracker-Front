#!/usr/bin/env python3
"""
Script para separar User Stories das Tasks reais do Trello
"""

import json
import sys
import re

def categorize_cards(filename: str):
    """Categoriza os cards entre User Stories e Tasks"""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        sys.exit(1)
    
    if 'cards' not in data:
        print("Nenhum card encontrado no arquivo")
        return
    
    cards = data['cards']
    
    # Criar mapa de listas
    lists_map = {}
    if 'lists' in data:
        for list_item in data['lists']:
            lists_map[list_item['id']] = list_item['name']
    
    user_stories = []
    tasks = []
    others = []
    
    for card in cards:
        name = card.get('name', '')
        closed = card.get('closed', False)
        list_id = card.get('idList', '')
        list_name = lists_map.get(list_id, 'Unknown')
        
        card_info = {
            'name': name,
            'closed': closed,
            'list': list_name,
            'id': card.get('id', ''),
            'desc': card.get('desc', '')
        }
        
        # Verificar se é User Story (começa com US)
        if re.match(r'^US\d+', name):
            user_stories.append(card_info)
        # Verificar se é Task (tem código como ED 002, TP 003, etc.)
        elif re.search(r'→\s*[A-Z]{2,4}\s*\d+', name):
            tasks.append(card_info)
        else:
            others.append(card_info)
    
    print("📚 USER STORIES (Orientações para a equipe):")
    print("=" * 80)
    for i, us in enumerate(user_stories, 1):
        status = "✅" if us['closed'] else "⏳"
        print(f"{i:2d}. {status} {us['name']}")
        print(f"    📍 Lista: {us['list']}")
        print()
    
    print("\n🎯 TASKS REAIS (Trabalho a ser executado):")
    print("=" * 80)
    for i, task in enumerate(tasks, 1):
        status = "✅" if task['closed'] else "⏳"
        print(f"{i:2d}. {status} {task['name']}")
        print(f"    📍 Lista: {task['list']}")
        print()
    
    print("\n📋 OUTROS CARDS:")
    print("=" * 80)
    for i, other in enumerate(others, 1):
        status = "✅" if other['closed'] else "⏳"
        print(f"{i:2d}. {status} {other['name']}")
        print(f"    📍 Lista: {other['list']}")
        print()
    
    # Estatísticas
    print("\n📊 ESTATÍSTICAS:")
    print("=" * 50)
    print(f"📚 User Stories: {len(user_stories)} total")
    us_completed = len([us for us in user_stories if us['closed']])
    print(f"   ✅ Concluídas: {us_completed}")
    print(f"   ⏳ Pendentes: {len(user_stories) - us_completed}")
    print()
    
    print(f"🎯 Tasks: {len(tasks)} total")
    tasks_completed = len([task for task in tasks if task['closed']])
    print(f"   ✅ Concluídas: {tasks_completed}")
    print(f"   ⏳ Pendentes: {len(tasks) - tasks_completed}")
    print()
    
    print(f"📋 Outros: {len(others)} total")
    others_completed = len([other for other in others if other['closed']])
    print(f"   ✅ Concluídas: {others_completed}")
    print(f"   ⏳ Pendentes: {len(others) - others_completed}")
    
    # Calcular story points apenas das tasks
    total_sp = 0
    completed_sp = 0
    for task in tasks:
        sp_match = re.search(r'\[(\d+)\]', task['name'])
        if sp_match:
            sp = int(sp_match.group(1))
            total_sp += sp
            if task['closed']:
                completed_sp += sp
    
    print(f"\n🎲 STORY POINTS (apenas das tasks):")
    print(f"   Total: {total_sp}")
    print(f"   Concluídos: {completed_sp}")
    print(f"   Pendentes: {total_sp - completed_sp}")
    if total_sp > 0:
        print(f"   Taxa de conclusão: {(completed_sp/total_sp)*100:.1f}%")

def main():
    if len(sys.argv) != 2:
        print("Uso: python categorize_cards.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    categorize_cards(filename)

if __name__ == "__main__":
    main()
