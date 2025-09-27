#!/usr/bin/env python3
"""
Script para verificar tasks por coluna
"""

import json
import sys
import re

def check_tasks_by_column(filename: str):
    """Verifica tasks por coluna"""
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
    
    # Contar tasks por coluna
    column_counts = {}
    
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
            
            if list_name not in column_counts:
                column_counts[list_name] = []
            column_counts[list_name].append(name)
    
    print("🎯 TASKS POR COLUNA:")
    print("=" * 60)
    
    for column_name, tasks in column_counts.items():
        print(f"\n📋 {column_name}: {len(tasks)} tasks")
        print("-" * 40)
        for i, task in enumerate(tasks, 1):
            print(f"  {i}. {task}")
    
    print(f"\n📊 RESUMO:")
    print(f"Total de colunas com tasks: {len(column_counts)}")
    total_tasks = sum(len(tasks) for tasks in column_counts.values())
    print(f"Total de tasks: {total_tasks}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python check_tasks_by_column.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    check_tasks_by_column(filename)

if __name__ == "__main__":
    main()
