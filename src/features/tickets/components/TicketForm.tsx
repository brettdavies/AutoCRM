import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Textarea,
} from '@/shared/components';
import { TeamSelect } from './TeamSelect';

const ticketFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  team_id: z.string().optional(),
  priority: z.string().optional(),
  category_ids: z.array(z.string()).default([]),
  attachments: z.array(z.instanceof(File)).optional(),
});

type TicketCreationForm = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmit: (data: TicketCreationForm) => void;
  initialData?: Partial<TicketCreationForm>;
}

export function TicketForm({ onSubmit, initialData = {} }: TicketFormProps) {
  const form = useForm<TicketCreationForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      team_id: initialData.team_id,
      priority: initialData.priority,
      category_ids: initialData.category_ids || [],
      attachments: initialData.attachments,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter ticket title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="team_id"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Team</FormLabel>
              <FormControl>
                <TeamSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter ticket description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rich text editor coming soon */}
        <div className="h-48 border rounded-md p-4 bg-muted">
          Rich text editor coming soon
        </div>

        {/* Category selection coming soon */}
        <div className="h-24 border rounded-md p-4 bg-muted">
          Category selection coming soon
        </div>

        {/* File upload coming soon */}
        <div className="h-24 border rounded-md p-4 bg-muted">
          File upload coming soon
        </div>

        {/* Priority selection coming soon */}
        <div className="h-24 border rounded-md p-4 bg-muted">
          Priority selection coming soon
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="submit">
            Create Ticket
          </Button>
        </div>
      </form>
    </Form>
  );
} 