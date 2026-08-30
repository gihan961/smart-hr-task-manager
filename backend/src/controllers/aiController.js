const store = require('../store/memoryStore');

// 1. Smart Workload Balancer: Recommend best employee for a given task
const recommendTaskAssignment = async (req, res) => {
  const { taskId } = req.body;

  if (!store.tasks || store.tasks.length === 0) {
    return res.json({
      taskId: null,
      taskTitle: 'No Tasks in Database',
      topRecommendation: null,
      allCandidates: []
    });
  }

  const task = store.tasks.find(t => t.id === taskId) || store.tasks[0];
  const employees = store.users.filter(u => u.status === 'ACTIVE');

  // Compute recommendation score for each employee
  const candidates = employees.map(emp => {
    const profile = store.employeeProfiles.find(ep => ep.userId === emp.id) || {};
    const activeTasks = store.tasks.filter(t => t.assignedTo === emp.id && t.status !== 'COMPLETED').length;

    const accuracy = profile.taskAccuracyRate || 100.0;
    const capacityLoad = Math.min(100, Math.round((activeTasks / 5) * 100)); // % load
    const matchScore = Math.round((accuracy * 0.6) + ((100 - capacityLoad) * 0.4));

    return {
      userId: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      avatar: emp.avatar,
      role: emp.role,
      jobTitle: profile.jobTitle || emp.role,
      accuracyRate: accuracy,
      activeTasksCount: activeTasks,
      capacityLoadPercent: capacityLoad,
      matchScore,
      recommendationReason: `Task accuracy of ${accuracy}% with ${activeTasks} active tasks (${100 - capacityLoad}% capacity available).`
    };
  });

  // Sort by match score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  const topRecommendation = candidates[0] || null;

  res.json({
    taskId: task ? task.id : null,
    taskTitle: task ? task.title : 'General System Task',
    topRecommendation,
    allCandidates: candidates
  });
};


// 2. Leave Impact Risk Analyzer
const analyzeLeaveRisk = async (req, res) => {
  const leaveDays = parseInt(req.body.leaveDays || req.body.daysCount || 3);
  const openUrgentClaimBatches = parseInt(req.body.openUrgentClaimBatches || req.body.urgentBatches || 2);
  const availableStaffCount = Math.max(1, parseInt(req.body.availableStaffCount || req.body.staffCount || 4));

  // 1. Try calling the Python Scikit-Learn AI Microservice on port 8000
  try {
    const aiResponse = await fetch('http://127.0.0.1:8000/api/ai/analyze-leave-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaveDays,
        openUrgentClaimBatches,
        availableStaffCount
      })
    });

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json({
        leaveDays,
        openUrgentClaimBatches,
        availableStaffCount,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        reasoning: data.recommendation || data.reasoning,
        source: 'Python Scikit-Learn ML Engine'
      });
    }
  } catch (err) {
    console.warn('AI Microservice on Port 8000 unreachable, using fallback ML calculation:', err.message);
  }

  // 2. Fallback dynamic calculation if Python AI microservice is offline
  const baseRisk = (leaveDays * openUrgentClaimBatches * 22.5) / availableStaffCount;
  const riskScore = Math.min(99.0, Math.max(5.0, Math.round(baseRisk * 10) / 10));
  
  let riskLevel = 'LOW';
  if (riskScore > 60) {
    riskLevel = 'HIGH';
  } else if (riskScore > 35) {
    riskLevel = 'MODERATE';
  }

  const reasoning = `Evaluated SLA filing breach risk: ${riskLevel} (${riskScore}%). Leave window of ${leaveDays} day(s) for ${openUrgentClaimBatches} urgent batch(es) with ${availableStaffCount} staff active.`;

  return res.json({
    leaveDays,
    openUrgentClaimBatches,
    availableStaffCount,
    riskScore,
    riskLevel,
    reasoning,
    source: 'JS Predictive Fallback Engine'
  });
};

// 3. Performance & Productivity Predictor
const predictPerformance = (req, res) => {
  const employees = store.users;

  const predictions = employees.map(emp => {
    const profile = store.employeeProfiles.find(ep => ep.userId === emp.id) || {};
    const accuracy = profile.taskAccuracyRate || profile.codingAccuracyRate || 97.0;
    const completedTasks = store.tasks.filter(t => t.assignedTo === emp.id && t.status === 'COMPLETED').length;

    const attritionRisk = accuracy < 94 ? 'MODERATE' : 'LOW';
    const performanceTrend = accuracy >= 98 ? 'HIGH_PERFORMER' : 'STABLE';

    return {
      userId: emp.id,
      userName: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      jobTitle: profile.jobTitle || emp.role,
      accuracyRate: accuracy,
      completedTasks,
      performanceTrend,
      attritionRisk,
      productivityScore: Math.round(accuracy * 0.9 + completedTasks * 2)
    };
  });

  res.json(predictions);
};

// 4. AI Productivity Report Generator
const generateProductivityReport = (req, res) => {
  const totalUsers = store.users.length;
  const totalTasks = store.tasks.length;
  const completedTasks = store.tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  res.json({
    summary: `AI Workforce Intelligence Report: Organization overall productivity is performing at ${completionRate}% efficiency. Staff utilization is balanced across departments.`,
    metrics: {
      totalEmployees: totalUsers,
      totalTasksTracked: totalTasks,
      completedTasksCount: completedTasks,
      taskCompletionRate: completionRate,
      averageTaskAccuracy: 97.8,
      recommendedActions: [
        'Rebalance pending high-priority tasks in Software Engineering department.',
        'Approve Q3 employee appraisals to maintain high retention engagement.',
        'Schedule upcoming milestone reviews for Smart HR Core Platform Upgrade project.'
      ]
    },
    generatedAt: new Date().toISOString()
  });
};

module.exports = {
  recommendTaskAssignment,
  analyzeLeaveRisk,
  predictPerformance,
  generateProductivityReport
};
