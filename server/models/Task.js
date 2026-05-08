const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
    },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate:    { type: Date, default: null },
    comments:   [commentSchema],
    tags:       [{ type: String, trim: true }],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);