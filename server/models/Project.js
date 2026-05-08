const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    deadline: { type: Date, default: null },
  },
  { timestamps: true }
);

// Always ensure owner is in members as admin
projectSchema.pre('save', function () {
  const ownerExists = this.members.some(
    (m) => m.user.toString() === this.owner.toString()
  );
  if (!ownerExists) this.members.push({ user: this.owner, role: 'admin' });
  
});

module.exports = mongoose.model('Project', projectSchema);