#!/usr/bin/env python3
"""
Script para investigar profundamente a estrutura do JSON do Trello
"""

import json
import sys

def deep_analyze_json(filename: str):
    """Faz uma análise profunda do JSON para encontrar todos os dados"""
    print("Fazendo análise profunda do JSON...")
    
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    def find_all_keys(obj, path=""):
        """Encontra todas as chaves no JSON"""
        keys = set()
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = f"{path}.{key}" if path else key
                keys.add(current_path)
                if isinstance(value, (dict, list)):
                    keys.update(find_all_keys(value, current_path))
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                current_path = f"{path}[{i}]" if path else f"[{i}]"
                keys.update(find_all_keys(item, current_path))
        return keys
    
    print("Todas as chaves encontradas:")
    all_keys = find_all_keys(data)
    for key in sorted(all_keys):
        print(f"  {key}")
    
    print("\n" + "="*60)
    print("ANÁLISE DETALHADA DOS CHECKLISTS:")
    print("="*60)
    
    if 'checklists' in data:
        print(f"Total de checklists: {len(data['checklists'])}")
        for i, checklist in enumerate(data['checklists']):
            print(f"\nChecklist {i+1}:")
            print(f"  ID: {checklist.get('id', 'N/A')}")
            print(f"  Nome: {checklist.get('name', 'N/A')}")
            print(f"  ID Card: {checklist.get('idCard', 'N/A')}")
            print(f"  CheckItems: {len(checklist.get('checkItems', []))}")
            
            if checklist.get('checkItems'):
                for j, item in enumerate(checklist['checkItems']):
                    print(f"    Item {j+1}: {item.get('name', 'N/A')} - {item.get('state', 'N/A')}")
    
    print("\n" + "="*60)
    print("ANÁLISE DETALHADA DOS CARDS:")
    print("="*60)
    
    if 'cards' in data:
        print(f"Total de cards: {len(data['cards'])}")
        cards_with_checklists = 0
        for i, card in enumerate(data['cards'][:10]):  # Primeiros 10 cards
            print(f"\nCard {i+1}: {card.get('name', 'Sem nome')}")
            print(f"  ID: {card.get('id', 'N/A')}")
            print(f"  Lista: {card.get('idList', 'N/A')}")
            print(f"  Fechado: {card.get('closed', False)}")
            
            # Verificar se tem checklists dentro do card
            if 'checklists' in card:
                cards_with_checklists += 1
                print(f"  Checklists no card: {len(card['checklists'])}")
                for checklist in card['checklists']:
                    print(f"    - {checklist.get('name', 'Sem nome')}")
                    if 'checkItems' in checklist:
                        print(f"      Items: {len(checklist['checkItems'])}")
        
        print(f"\nCards com checklists internos: {cards_with_checklists}")
    
    print("\n" + "="*60)
    print("VERIFICANDO ACTIONS (pode conter dados de checklists):")
    print("="*60)
    
    if 'actions' in data:
        print(f"Total de actions: {len(data['actions'])}")
        checklist_actions = 0
        for action in data['actions'][:20]:  # Primeiras 20 actions
            if 'type' in action and 'checklist' in action['type'].lower():
                checklist_actions += 1
                print(f"  Action tipo: {action.get('type', 'N/A')}")
                if 'data' in action:
                    print(f"    Data: {action['data']}")
        
        print(f"Actions relacionadas a checklists: {checklist_actions}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python analyze_trello.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    deep_analyze_json(filename)

if __name__ == "__main__":
    main()
