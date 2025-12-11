'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  generateGoogleCalendarUrl,
  downloadICSFile,
  type CalendarEvent,
} from '@/lib/calendar-utils';
import { toast } from 'sonner';

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AddToCalendarButton({
  event,
  variant = 'outline',
  size = 'sm',
  className,
}: AddToCalendarButtonProps) {
  const handleAddToGoogle = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Ouverture de Google Calendar');
  };

  const handleDownloadICS = () => {
    downloadICSFile(event);
    toast.success('Fichier .ics téléchargé');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          Ajouter au calendrier
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleAddToGoogle} className="cursor-pointer">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          Google Calendar
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer">
          <Calendar className="h-4 w-4 mr-2" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
