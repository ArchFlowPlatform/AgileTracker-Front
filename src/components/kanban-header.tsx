'use client';

import { useState } from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function KanbanHeader() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implementar busca real
    console.log('Searching for:', query);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Team */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                <span className="text-white text-xs">T</span>
              </div>
              <span className="font-semibold text-gray-900">Team 1</span>
              <Badge variant="secondary" className="text-xs">
                Free
              </Badge>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right side - Actions and Profile */}
        <div className="flex items-center space-x-4">
          {/* Language */}
          <Button variant="ghost" size="sm" className="p-2">
            <span className="text-sm">🇬🇧</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs"
            >
              4
            </Badge>
          </Button>

          {/* User */}
          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
