-- Add foreign key constraint for conversations.sender_id
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_sender_id_fkey,
  ADD CONSTRAINT conversations_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE; 