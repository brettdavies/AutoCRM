import React, { useState } from 'react';
import { useTicket } from '../hooks/useTicket';
import type { CreateTicketDTO } from '../types/ticket.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
  Badge,
  Textarea,
} from '@/shared/components';

interface CreateTicketProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateTicket({ onSuccess, onCancel }: CreateTicketProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createTicket, isLoading } = useTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      const ticketData: CreateTicketDTO = {
        title: title.trim(),
        description: description.trim(),
        categories: categories
      };

      await createTicket(ticketData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create New Ticket</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ticket title"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter ticket description"
              required
            />
          </div>

          {/* Categories Input */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {category}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveCategory(category)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add a category"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCategory}
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Ticket'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 