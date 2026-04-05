-- ============================================================
-- DMIS — SQL fix for Volunteer Dashboard
-- Run this in Supabase SQL Editor BEFORE testing volunteer features
-- ============================================================

-- Allow volunteers to update the status of tasks they are assigned to
-- (needed for "Task Updates" tab — marking tasks Ongoing or Completed)
DROP POLICY IF EXISTS "Volunteer updates assigned task status" ON tasks;

CREATE POLICY "Volunteer updates assigned task status"
  ON tasks FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT volunteer_id FROM assignments
      WHERE task_id = tasks.id AND status = 'Active'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT volunteer_id FROM assignments
      WHERE task_id = tasks.id AND status = 'Active'
    )
  );

-- Also allow volunteers to update their own assignment status
-- (mark assignment as Completed when task is done)
DROP POLICY IF EXISTS "Volunteer updates own assignment status" ON assignments;

CREATE POLICY "Volunteer updates own assignment status"
  ON assignments FOR UPDATE
  USING (volunteer_id = auth.uid())
  WITH CHECK (volunteer_id = auth.uid());

-- Allow volunteers to mark their own notifications as read
DROP POLICY IF EXISTS "Volunteer marks notification read" ON notifications;

CREATE POLICY "Volunteer marks notification read"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- ============================================================
-- DONE
-- ============================================================
