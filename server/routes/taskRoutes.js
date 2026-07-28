const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Draft = require('../models/draft');
const { requireAuth } = require('../middleware/authMiddleware');

// Helper to check if user is a member of the draft workspace
async function isWorkspaceMember(userId, draftId) {
  const draft = await Draft.findById(draftId);
  if (!draft) return false;
  const isOwner = draft.submittedBy && draft.submittedBy.toString() === userId.toString();
  const isCollaborator = draft.collaborators && draft.collaborators.some(c => c.toString() === userId.toString());
  return isOwner || isCollaborator;
}

// GET /api/tasks/:draftId - Fetch tasks for a draft
router.get('/tasks/:draftId', requireAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, draftId);
    if (!member) {
      return res.status(403).json({ error: 'You must be a workspace member to view tasks' });
    }
    
    const tasks = await Task.find({ draftId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - Create a task
router.post('/tasks', requireAuth, async (req, res) => {
  try {
    const { draftId, title, description, status, priority, dueDate, assignee, labels, checklist } = req.body;
    
    if (!draftId) {
      return res.status(400).json({ error: 'draftId is required' });
    }
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, draftId);
    if (!member) {
      return res.status(403).json({ error: 'Only workspace members can create tasks' });
    }
    
    const task = new Task({
      draftId,
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate,
      assignee,
      labels: labels || [],
      checklist: checklist || [],
      comments: []
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id - Update task fields
router.patch('/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, task.draftId);
    if (!member) {
      return res.status(403).json({ error: 'Only workspace members can update tasks' });
    }
    
    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 'dueDate',
      'assignee', 'labels', 'dependencies', 'linkedPR', 'attachments'
    ];
    
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        task[update] = req.body[update];
      }
    });
    
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, task.draftId);
    if (!member) {
      return res.status(403).json({ error: 'Only workspace members can delete tasks' });
    }
    
    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/comments - Add a comment
router.post('/tasks/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, task.draftId);
    if (!member) {
      return res.status(403).json({ error: 'Only workspace members can add comments' });
    }
    
    task.comments.push({
      author: req.user.fullName || req.user.username || 'Workspace Member',
      avatar: req.user.avatar || '',
      text,
      createdAt: new Date()
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/checklist - Update/Toggle checklist
router.patch('/tasks/:id/checklist', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;
    
    if (!checklist) {
      return res.status(400).json({ error: 'checklist array is required' });
    }
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Verify membership
    const member = await isWorkspaceMember(req.user._id, task.draftId);
    if (!member) {
      return res.status(403).json({ error: 'Only workspace members can edit checklist' });
    }
    
    task.checklist = checklist;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
