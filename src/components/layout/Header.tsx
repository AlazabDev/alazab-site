import React, { FormEvent, useState } from 'react';
import { Home, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserAccountMenu from '@/components/shared/UserAccountMenu';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/approvals/documents?search=${encodeURIComponent(value)}` : '/approvals/documents');
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-16 items-center gap-3 px-3 sm:px-6">
        <SidebarTrigger className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
          {subtitle ? <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p> : null}
        </div>

        <form onSubmit={submitSearch} className="relative hidden w-64 lg:block">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في المستندات..." className="pe-10" />
        </form>

        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex" title="لوحة التحكم الرئيسية">
          <Link to="/dashboard"><Home className="h-5 w-5" /></Link>
        </Button>
        <UserAccountMenu />
      </div>
    </header>
  );
}
