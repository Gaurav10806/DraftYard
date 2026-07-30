const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Challenge = require('./models/Challenge');
const ChallengeParticipant = require('./models/ChallengeParticipant');
const User = require('./models/User');

dotenv.config();

async function seedChallenges() {
  try {
    await connectDB();

    console.log('Seeding Weekly Challenges into MongoDB...');

    await Challenge.deleteMany({});
    await ChallengeParticipant.deleteMany({});

    const now = new Date();

    const activeStart = new Date(now);
    activeStart.setDate(activeStart.getDate() - 3);
    const activeEnd = new Date(now);
    activeEnd.setDate(activeEnd.getDate() + 6);
    activeEnd.setHours(activeEnd.getHours() + 12);

    const upcoming1Start = new Date(now);
    upcoming1Start.setDate(upcoming1Start.getDate() + 7);
    const upcoming1End = new Date(now);
    upcoming1End.setDate(upcoming1End.getDate() + 14);

    const upcoming2Start = new Date(now);
    upcoming2Start.setDate(upcoming2Start.getDate() + 15);
    const upcoming2End = new Date(now);
    upcoming2End.setDate(upcoming2End.getDate() + 22);

    const expiredStart = new Date(now);
    expiredStart.setDate(expiredStart.getDate() - 20);
    const expiredEnd = new Date(now);
    expiredEnd.setDate(expiredEnd.getDate() - 5);

    const challengesData = [
      {
        title: 'AI Productivity Challenge',
        slug: 'ai-productivity-challenge',
        description:
          'Build a tool or submit a draft that helps developers save at least 30 minutes every day through intelligent workflow automation, smart coding assistants, or prompt tools.',
        startDate: activeStart,
        endDate: activeEnd,
        rewards: [
          { icon: 'Star', label: 'Featured on Homepage', value: '1st Place' },
          { icon: 'Medal', label: 'Exclusive Challenge Badge', value: 'All Finishers' },
          { icon: 'Trophy', label: 'Top 3 Community Showcase', value: 'Top 3' },
        ],
        eligibilityRules: [
          'Open to all registered DraftYard users',
          'Must submit a new draft or update an existing project during the active window',
          'Projects can be solo or team endeavors in Web or ML/AI domains',
        ],
        completionCriteria: {
          type: 'create_draft',
          targetCount: 1,
          domain: 'ml',
          description: 'Submit or document at least 1 draft in the ML or AI domain during the challenge.',
        },
        badge: 'AI Innovator 🏆',
        participantCount: 0,
      },
      {
        title: 'Full-Stack Web Revival Sprint',
        slug: 'web-revival-sprint',
        description:
          'Document and publish an abandoned web application project with architectural insights, failure analysis, and clear tech stack breakdowns.',
        startDate: upcoming1Start,
        endDate: upcoming1End,
        rewards: [
          { icon: 'Award', label: 'Revival Hero Badge', value: 'Badge' },
          { icon: 'Zap', label: '500 Revival XP Points', value: 'XP' },
          { icon: 'Star', label: 'Community Newsletter Feature', value: 'Feature' },
        ],
        eligibilityRules: [
          'Must specify failure reason and tech stack',
          'Must mark draft as Open for Revival',
        ],
        completionCriteria: {
          type: 'create_draft',
          targetCount: 1,
          domain: 'web',
          description: 'Submit 1 Web domain draft with Open for Revival enabled.',
        },
        badge: 'Web Pioneer 🌐',
        participantCount: 0,
      },
      {
        title: 'Mobile UX & Accessibility Hack',
        slug: 'mobile-ux-accessibility-hack',
        description:
          'Design and present a mobile app draft with a focus on accessibility, intuitive offline support, or smooth cross-platform micro-interactions.',
        startDate: upcoming2Start,
        endDate: upcoming2End,
        rewards: [
          { icon: 'Crown', label: 'UX Master Badge', value: 'Badge' },
          { icon: 'Star', label: 'Sidebar Spotlight', value: 'Spotlight' },
        ],
        eligibilityRules: [
          'Must target Mobile domain (iOS / Android / React Native / Flutter)',
          'Must detail at least 2 accessibility or offline features in project notes',
        ],
        completionCriteria: {
          type: 'create_draft',
          targetCount: 1,
          domain: 'mobile',
          description: 'Submit 1 Mobile app draft during the event.',
        },
        badge: 'UX Master 📱',
        participantCount: 0,
      },
      {
        title: 'Open Source Tooling Sprint',
        slug: 'open-source-tooling-sprint',
        description:
          'Share an open source developer utility draft that streamlines daily debugging, API testing, or local build environments.',
        startDate: expiredStart,
        endDate: expiredEnd,
        rewards: [
          { icon: 'Trophy', label: 'Open Source Vanguard', value: 'Badge' },
          { icon: 'Medal', label: 'Hall of Fame Entry', value: 'Showcase' },
        ],
        eligibilityRules: [
          'Project code or architecture must be publicly reviewable',
        ],
        completionCriteria: {
          type: 'create_draft',
          targetCount: 1,
          description: 'Submitted 1 developer tool draft.',
        },
        badge: 'OS Vanguard ⚡',
        participantCount: 0,
      },
    ];

    const insertedChallenges = await Challenge.insertMany(challengesData);
    console.log(`Successfully seeded ${insertedChallenges.length} challenges!`);

    const sampleUser = await User.findOne();
    if (sampleUser && insertedChallenges[0]) {
      const activeCh = insertedChallenges[0];
      await ChallengeParticipant.create({
        challengeId: activeCh._id,
        userId: sampleUser._id,
        joinedAt: new Date(),
        status: 'joined',
        progress: {
          current: 0,
          target: activeCh.completionCriteria.targetCount || 1,
          percentage: 0,
          details: '0/1 criteria met',
        },
      });
      activeCh.participantCount = 1;
      await activeCh.save();
      console.log(`Seeded 1 participant (${sampleUser.name}) into Active Challenge!`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding challenges:', err);
    process.exit(1);
  }
}

seedChallenges();
