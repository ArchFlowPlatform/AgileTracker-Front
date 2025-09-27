#!/usr/bin/env python3
"""
Script para listar todos os nomes dos cards do Trello
"""

import json
import sys

def list_card_names(filename: str):
    """Lista todos os nomes dos cards do arquivo JSON do Trello"""
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
    print(f"📋 LISTA DE CARDS ({len(cards)} total):")
    print("=" * 80)
    
    for i, card in enumerate(cards, 1):
        name = card.get('name', 'Sem nome')
        closed = "✅" if card.get('closed', False) else "⏳"
        list_name = card.get('idList', 'Unknown')
        
        # Tentar encontrar o nome da lista
        if 'lists' in data:
            for list_item in data['lists']:
                if list_item['id'] == list_name:
                    list_name = list_item['name']
                    break
        
        print(f"{i:2d}. {closed} {name}")
        print(f"    📍 Lista: {list_name}")
        print()

def main():
    if len(sys.argv) != 2:
        print("Uso: python list_cards.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    list_card_names(filename)

if __name__ == "__main__":
    main()
