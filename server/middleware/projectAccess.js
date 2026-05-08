const Project = require('../models/Project');

const projectAccess = async (req, res, next) => {
  try {
    const id = req.params.projectId || req.body.project;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not a member of this project' });

    req.project = project;
    req.projectRole = member ? member.role : 'admin';
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const projectAdminOnly = (req, res, next) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Project admin access required' });
  next();
};

module.exports = { projectAccess, projectAdminOnly };