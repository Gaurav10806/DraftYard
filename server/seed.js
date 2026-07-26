const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("node:dns");
const Draft = require("./models/draft");

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const fakeBurials = [
  {
    "projectName": "NexusFlow",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "React",
      "Next.js",
      "FastAPI",
      "AWS",
      "Redis"
    ],
    "teamSize": 1,
    "currentStage": "Beta",
    "failureReason": "Market competition",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 13,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_22",
    "upvotes": 312,
    "views": 3433,
    "bookmarks": 149,
    "raisedHands": 127,
    "lastWorkedOn": "2025-09-13T23:04:57",
    "createdAt": "2025-07-06T23:04:57",
    "updatedAt": "2025-08-28T23:04:57"
  },
  {
    "projectName": "EchoDesk",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "React",
      "Kubernetes",
      "Node.js",
      "PostgreSQL",
      "Firebase",
      "FastAPI"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 22,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_12",
    "upvotes": 189,
    "views": 3662,
    "bookmarks": 246,
    "raisedHands": 26,
    "lastWorkedOn": "2025-10-04T11:04:57",
    "createdAt": "2025-06-16T11:04:57",
    "updatedAt": "2025-09-05T11:04:57"
  },
  {
    "projectName": "GreenLearn",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "TypeScript",
      "Python",
      "Docker"
    ],
    "teamSize": 8,
    "currentStage": "Beta",
    "failureReason": "Low user retention",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 5,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_13",
    "upvotes": 448,
    "views": 14938,
    "bookmarks": 83,
    "raisedHands": 56,
    "lastWorkedOn": "2025-10-05T22:04:57",
    "createdAt": "2025-09-16T22:04:57",
    "updatedAt": "2025-09-18T22:04:57"
  },
  {
    "projectName": "NexusLearn",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "PostgreSQL",
      "Python",
      "Kubernetes",
      "Redis",
      "Node.js"
    ],
    "teamSize": 2,
    "currentStage": "Research",
    "failureReason": "Market competition",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 14,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_28",
    "upvotes": 21,
    "views": 13970,
    "bookmarks": 118,
    "raisedHands": 68,
    "lastWorkedOn": "2025-03-03T21:04:57",
    "createdAt": "2024-11-22T21:04:57",
    "updatedAt": "2025-02-08T21:04:57"
  },
  {
    "projectName": "QuickDesk",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "Express",
      "Flask",
      "Node.js",
      "Kubernetes",
      "PostgreSQL",
      "FastAPI"
    ],
    "teamSize": 7,
    "currentStage": "Prototype",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 22,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_17",
    "upvotes": 723,
    "views": 4727,
    "bookmarks": 71,
    "raisedHands": 43,
    "lastWorkedOn": "2026-06-10T08:04:57",
    "createdAt": "2026-05-17T08:04:57",
    "updatedAt": "2026-05-24T08:04:57"
  },
  {
    "projectName": "QuickPilot",
    "oneLiner": "A agritech startup focused on improving user experience through automation and data insights.",
    "domain": "AgriTech",
    "techStack": [
      "PostgreSQL",
      "Docker",
      "Node.js"
    ],
    "teamSize": 7,
    "currentStage": "Early Users",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 19,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_7",
    "upvotes": 685,
    "views": 12406,
    "bookmarks": 289,
    "raisedHands": 64,
    "lastWorkedOn": "2026-02-02T08:04:57",
    "createdAt": "2025-12-11T08:04:57",
    "updatedAt": "2026-01-21T08:04:57"
  },
  {
    "projectName": "GreenLearn",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Tailwind CSS",
      "Node.js",
      "PostgreSQL",
      "FastAPI",
      "AWS",
      "MongoDB"
    ],
    "teamSize": 1,
    "currentStage": "Early Users",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_26",
    "upvotes": 249,
    "views": 4818,
    "bookmarks": 114,
    "raisedHands": 39,
    "lastWorkedOn": "2025-08-22T06:04:57",
    "createdAt": "2025-04-20T06:04:57",
    "updatedAt": "2025-08-15T06:04:57"
  },
  {
    "projectName": "SecureTrack",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "Tailwind CSS",
      "Python",
      "AWS",
      "Next.js",
      "Express"
    ],
    "teamSize": 1,
    "currentStage": "Research",
    "failureReason": "Low user retention",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 11,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_10",
    "upvotes": 363,
    "views": 8061,
    "bookmarks": 86,
    "raisedHands": 34,
    "lastWorkedOn": "2025-07-12T09:04:57",
    "createdAt": "2025-03-23T09:04:57",
    "updatedAt": "2025-06-25T09:04:57"
  },
  {
    "projectName": "UrbanLearn",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Tailwind CSS",
      "Redis",
      "Firebase",
      "MongoDB",
      "Next.js",
      "Node.js"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Low user retention",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 19,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_6",
    "upvotes": 627,
    "views": 3135,
    "bookmarks": 87,
    "raisedHands": 51,
    "lastWorkedOn": "2024-11-16T22:04:57",
    "createdAt": "2024-09-05T22:04:57",
    "updatedAt": "2024-10-27T22:04:57"
  },
  {
    "projectName": "GreenHealth",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "TypeScript",
      "Node.js",
      "AWS",
      "Redis"
    ],
    "teamSize": 4,
    "currentStage": "MVP",
    "failureReason": "Feature overload",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 14,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_13",
    "upvotes": 117,
    "views": 6376,
    "bookmarks": 25,
    "raisedHands": 180,
    "lastWorkedOn": "2026-07-24T11:04:57",
    "createdAt": "2026-04-06T09:04:57",
    "updatedAt": "2026-08-02T09:04:57"
  },
  {
    "projectName": "SmartSense",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Tailwind CSS",
      "Next.js",
      "Node.js",
      "AWS"
    ],
    "teamSize": 6,
    "currentStage": "Prototype",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 6,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_4",
    "upvotes": 268,
    "views": 10140,
    "bookmarks": 238,
    "raisedHands": 60,
    "lastWorkedOn": "2025-10-22T14:04:57",
    "createdAt": "2025-08-06T14:04:57",
    "updatedAt": "2025-10-09T14:04:57"
  },
  {
    "projectName": "FusionHealth",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Node.js",
      "Kubernetes",
      "Express",
      "Firebase"
    ],
    "teamSize": 2,
    "currentStage": "Early Users",
    "failureReason": "Low user retention",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 18,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_13",
    "upvotes": 208,
    "views": 4354,
    "bookmarks": 5,
    "raisedHands": 158,
    "lastWorkedOn": "2025-10-17T14:04:57",
    "createdAt": "2025-06-07T14:04:57",
    "updatedAt": "2025-09-26T14:04:57"
  },
  {
    "projectName": "NovaTrack",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "React",
      "FastAPI",
      "Redis"
    ],
    "teamSize": 3,
    "currentStage": "Beta",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 2,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_24",
    "upvotes": 623,
    "views": 14350,
    "bookmarks": 12,
    "raisedHands": 176,
    "lastWorkedOn": "2026-02-02T20:04:57",
    "createdAt": "2025-10-21T20:04:57",
    "updatedAt": "2026-01-27T20:04:57"
  },
  {
    "projectName": "QuickHub",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "Next.js",
      "AWS",
      "Flask",
      "MongoDB",
      "Firebase",
      "FastAPI"
    ],
    "teamSize": 7,
    "currentStage": "MVP",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 20,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_3",
    "upvotes": 721,
    "views": 3122,
    "bookmarks": 62,
    "raisedHands": 165,
    "lastWorkedOn": "2025-11-24T16:04:57",
    "createdAt": "2025-09-01T16:04:57",
    "updatedAt": "2025-11-15T16:04:57"
  },
  {
    "projectName": "OrbitHub",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "AWS",
      "Node.js",
      "TypeScript"
    ],
    "teamSize": 3,
    "currentStage": "Early Users",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 17,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_24",
    "upvotes": 88,
    "views": 13756,
    "bookmarks": 97,
    "raisedHands": 27,
    "lastWorkedOn": "2025-05-29T21:04:57",
    "createdAt": "2025-03-13T21:04:57",
    "updatedAt": "2025-05-16T21:04:57"
  },
  {
    "projectName": "VisionGuard",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "Python",
      "Kubernetes",
      "AWS",
      "Firebase",
      "Next.js"
    ],
    "teamSize": 2,
    "currentStage": "Research",
    "failureReason": "Technical complexity",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 9,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_8",
    "upvotes": 515,
    "views": 7722,
    "bookmarks": 307,
    "raisedHands": 123,
    "lastWorkedOn": "2026-07-22T11:04:57",
    "createdAt": "2026-05-22T13:04:57",
    "updatedAt": "2026-08-12T13:04:57"
  },
  {
    "projectName": "HyperHub",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "Express",
      "MongoDB",
      "Tailwind CSS"
    ],
    "teamSize": 3,
    "currentStage": "Idea",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 3,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_5",
    "upvotes": 615,
    "views": 7290,
    "bookmarks": 298,
    "raisedHands": 68,
    "lastWorkedOn": "2025-08-24T00:04:57",
    "createdAt": "2025-05-12T00:04:57",
    "updatedAt": "2025-08-22T00:04:57"
  },
  {
    "projectName": "HivePulse",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "TypeScript",
      "FastAPI",
      "PostgreSQL",
      "Python",
      "Tailwind CSS",
      "MongoDB"
    ],
    "teamSize": 6,
    "currentStage": "Pivoting",
    "failureReason": "Low user retention",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_5",
    "upvotes": 526,
    "views": 1117,
    "bookmarks": 20,
    "raisedHands": 8,
    "lastWorkedOn": "2026-07-05T13:04:57",
    "createdAt": "2026-03-08T13:04:57",
    "updatedAt": "2026-06-10T13:04:57"
  },
  {
    "projectName": "GreenGuard",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Flask",
      "Tailwind CSS",
      "Docker"
    ],
    "teamSize": 6,
    "currentStage": "Pivoting",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 11,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_28",
    "upvotes": 246,
    "views": 12222,
    "bookmarks": 136,
    "raisedHands": 62,
    "lastWorkedOn": "2025-02-15T17:04:57",
    "createdAt": "2025-01-15T17:04:57",
    "updatedAt": "2025-01-27T17:04:57"
  },
  {
    "projectName": "EchoPilot",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "Next.js",
      "Tailwind CSS",
      "Node.js",
      "Python",
      "Firebase",
      "React"
    ],
    "teamSize": 8,
    "currentStage": "Prototype",
    "failureReason": "No clear product-market fit",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 6,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 558,
    "views": 7395,
    "bookmarks": 333,
    "raisedHands": 119,
    "lastWorkedOn": "2025-06-03T01:04:57",
    "createdAt": "2025-01-31T01:04:57",
    "updatedAt": "2025-05-18T01:04:57"
  },
  {
    "projectName": "QuantumLearn",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "Next.js",
      "Flask",
      "FastAPI"
    ],
    "teamSize": 7,
    "currentStage": "Research",
    "failureReason": "Technical complexity",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 11,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_8",
    "upvotes": 146,
    "views": 6324,
    "bookmarks": 208,
    "raisedHands": 127,
    "lastWorkedOn": "2024-11-24T06:04:57",
    "createdAt": "2024-10-07T06:04:57",
    "updatedAt": "2024-10-27T06:04:57"
  },
  {
    "projectName": "PulsePilot",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "PostgreSQL",
      "Express",
      "React"
    ],
    "teamSize": 6,
    "currentStage": "Idea",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 15,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_13",
    "upvotes": 725,
    "views": 14854,
    "bookmarks": 203,
    "raisedHands": 125,
    "lastWorkedOn": "2025-09-03T10:04:57",
    "createdAt": "2025-06-30T10:04:57",
    "updatedAt": "2025-09-03T10:04:57"
  },
  {
    "projectName": "VisionLink",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "Flask",
      "Firebase",
      "FastAPI",
      "Python",
      "Node.js"
    ],
    "teamSize": 2,
    "currentStage": "Prototype",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 6,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_29",
    "upvotes": 277,
    "views": 1652,
    "bookmarks": 112,
    "raisedHands": 164,
    "lastWorkedOn": "2025-12-05T10:04:57",
    "createdAt": "2025-10-01T10:04:57",
    "updatedAt": "2025-11-08T10:04:57"
  },
  {
    "projectName": "SwiftHealth",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "Tailwind CSS",
      "PostgreSQL",
      "FastAPI",
      "MongoDB",
      "Express",
      "React"
    ],
    "teamSize": 1,
    "currentStage": "MVP",
    "failureReason": "Low user retention",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 19,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 241,
    "views": 4890,
    "bookmarks": 118,
    "raisedHands": 152,
    "lastWorkedOn": "2026-04-26T23:04:57",
    "createdAt": "2026-03-28T23:04:57",
    "updatedAt": "2026-04-08T23:04:57"
  },
  {
    "projectName": "PulsePulse",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Tailwind CSS",
      "Express",
      "Node.js",
      "MongoDB",
      "FastAPI"
    ],
    "teamSize": 2,
    "currentStage": "Prototype",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 8,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_19",
    "upvotes": 254,
    "views": 12146,
    "bookmarks": 57,
    "raisedHands": 106,
    "lastWorkedOn": "2025-03-02T20:04:57",
    "createdAt": "2024-11-09T20:04:57",
    "updatedAt": "2025-02-28T20:04:57"
  },
  {
    "projectName": "SmartDesk",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "Kubernetes",
      "Redis",
      "Next.js"
    ],
    "teamSize": 1,
    "currentStage": "Idea",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 3,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_26",
    "upvotes": 333,
    "views": 9740,
    "bookmarks": 30,
    "raisedHands": 26,
    "lastWorkedOn": "2026-05-30T03:04:57",
    "createdAt": "2026-04-11T03:04:57",
    "updatedAt": "2026-05-23T03:04:57"
  },
  {
    "projectName": "QuantumTrack",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Express",
      "Flask",
      "Kubernetes"
    ],
    "teamSize": 6,
    "currentStage": "Early Users",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 19,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_12",
    "upvotes": 592,
    "views": 10208,
    "bookmarks": 32,
    "raisedHands": 99,
    "lastWorkedOn": "2026-07-05T23:04:57",
    "createdAt": "2026-04-21T23:04:57",
    "updatedAt": "2026-07-05T23:04:57"
  },
  {
    "projectName": "CloudBridge",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Python",
      "Node.js",
      "Firebase",
      "React",
      "Docker"
    ],
    "teamSize": 7,
    "currentStage": "Prototype",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 2,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 54,
    "views": 10154,
    "bookmarks": 138,
    "raisedHands": 54,
    "lastWorkedOn": "2026-01-20T14:04:57",
    "createdAt": "2025-12-08T14:04:57",
    "updatedAt": "2026-01-04T14:04:57"
  },
  {
    "projectName": "QuantumHealth",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "React",
      "Firebase",
      "Kubernetes"
    ],
    "teamSize": 8,
    "currentStage": "Early Users",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 18,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_13",
    "upvotes": 350,
    "views": 5190,
    "bookmarks": 89,
    "raisedHands": 177,
    "lastWorkedOn": "2025-04-22T06:04:57",
    "createdAt": "2025-04-04T06:04:57",
    "updatedAt": "2025-04-19T06:04:57"
  },
  {
    "projectName": "CloudPulse",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "Tailwind CSS",
      "React",
      "Express"
    ],
    "teamSize": 8,
    "currentStage": "Research",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_10",
    "upvotes": 490,
    "views": 11864,
    "bookmarks": 257,
    "raisedHands": 54,
    "lastWorkedOn": "2026-01-20T01:04:57",
    "createdAt": "2025-09-26T01:04:57",
    "updatedAt": "2026-01-04T01:04:57"
  },
  {
    "projectName": "HyperScale",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Python",
      "Express",
      "Kubernetes",
      "React"
    ],
    "teamSize": 8,
    "currentStage": "Beta",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 2,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_27",
    "upvotes": 515,
    "views": 8958,
    "bookmarks": 123,
    "raisedHands": 6,
    "lastWorkedOn": "2025-06-29T13:04:57",
    "createdAt": "2025-02-28T13:04:57",
    "updatedAt": "2025-06-19T13:04:57"
  },
  {
    "projectName": "NexusCart",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "PostgreSQL",
      "Python",
      "Express"
    ],
    "teamSize": 3,
    "currentStage": "Research",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 4,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_25",
    "upvotes": 544,
    "views": 14988,
    "bookmarks": 209,
    "raisedHands": 28,
    "lastWorkedOn": "2025-10-13T12:04:57",
    "createdAt": "2025-08-27T12:04:57",
    "updatedAt": "2025-10-10T12:04:57"
  },
  {
    "projectName": "SecureFarm",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "Node.js",
      "PostgreSQL",
      "Python",
      "TypeScript"
    ],
    "teamSize": 2,
    "currentStage": "Research",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 12,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_8",
    "upvotes": 181,
    "views": 7236,
    "bookmarks": 29,
    "raisedHands": 154,
    "lastWorkedOn": "2025-11-16T05:04:57",
    "createdAt": "2025-09-12T05:04:57",
    "updatedAt": "2025-11-07T05:04:57"
  },
  {
    "projectName": "SmartDesk",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Kubernetes",
      "PostgreSQL",
      "FastAPI",
      "Tailwind CSS",
      "Flask"
    ],
    "teamSize": 3,
    "currentStage": "Early Users",
    "failureReason": "Market competition",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 9,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_2",
    "upvotes": 599,
    "views": 3919,
    "bookmarks": 74,
    "raisedHands": 71,
    "lastWorkedOn": "2025-06-04T14:04:57",
    "createdAt": "2025-03-14T14:04:57",
    "updatedAt": "2025-06-03T14:04:57"
  },
  {
    "projectName": "SwiftBridge",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "PostgreSQL",
      "Tailwind CSS",
      "Express",
      "Redis",
      "Kubernetes",
      "TypeScript"
    ],
    "teamSize": 5,
    "currentStage": "MVP",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 7,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 238,
    "views": 2586,
    "bookmarks": 77,
    "raisedHands": 140,
    "lastWorkedOn": "2025-04-06T09:04:57",
    "createdAt": "2025-03-08T09:04:57",
    "updatedAt": "2025-03-25T09:04:57"
  },
  {
    "projectName": "BrightMind",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "AWS",
      "Redis",
      "TypeScript",
      "Firebase",
      "Flask"
    ],
    "teamSize": 3,
    "currentStage": "Prototype",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 23,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_18",
    "upvotes": 542,
    "views": 13302,
    "bookmarks": 232,
    "raisedHands": 143,
    "lastWorkedOn": "2026-07-24T11:04:57",
    "createdAt": "2026-05-29T19:04:57",
    "updatedAt": "2026-08-28T19:04:57"
  },
  {
    "projectName": "OrbitPay",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "Firebase",
      "Kubernetes",
      "Flask",
      "PostgreSQL"
    ],
    "teamSize": 4,
    "currentStage": "Idea",
    "failureReason": "Low user retention",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 11,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_25",
    "upvotes": 316,
    "views": 484,
    "bookmarks": 126,
    "raisedHands": 11,
    "lastWorkedOn": "2026-01-30T16:04:57",
    "createdAt": "2025-12-12T16:04:57",
    "updatedAt": "2026-01-22T16:04:57"
  },
  {
    "projectName": "NovaGrid",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Firebase",
      "Express",
      "FastAPI"
    ],
    "teamSize": 7,
    "currentStage": "Beta",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 16,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_15",
    "upvotes": 701,
    "views": 1977,
    "bookmarks": 49,
    "raisedHands": 32,
    "lastWorkedOn": "2025-03-19T04:04:57",
    "createdAt": "2025-01-30T04:04:57",
    "updatedAt": "2025-03-05T04:04:57"
  },
  {
    "projectName": "CloudPilot",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "AWS",
      "MongoDB",
      "Node.js"
    ],
    "teamSize": 1,
    "currentStage": "Prototype",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 9,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_26",
    "upvotes": 614,
    "views": 13762,
    "bookmarks": 104,
    "raisedHands": 83,
    "lastWorkedOn": "2026-07-25T11:04:57",
    "createdAt": "2026-05-25T09:04:57",
    "updatedAt": "2026-09-17T09:04:57"
  },
  {
    "projectName": "UrbanDesk",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "Redis",
      "Node.js",
      "Python",
      "TypeScript",
      "PostgreSQL",
      "Next.js"
    ],
    "teamSize": 5,
    "currentStage": "Idea",
    "failureReason": "No clear product-market fit",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 12,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_6",
    "upvotes": 167,
    "views": 861,
    "bookmarks": 171,
    "raisedHands": 139,
    "lastWorkedOn": "2026-04-01T05:04:57",
    "createdAt": "2026-01-20T05:04:57",
    "updatedAt": "2026-03-31T05:04:57"
  },
  {
    "projectName": "SmartDrive",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Next.js",
      "Docker",
      "MongoDB",
      "TypeScript",
      "Redis",
      "Express"
    ],
    "teamSize": 8,
    "currentStage": "Prototype",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 15,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_20",
    "upvotes": 277,
    "views": 7248,
    "bookmarks": 202,
    "raisedHands": 62,
    "lastWorkedOn": "2024-11-07T00:04:57",
    "createdAt": "2024-09-27T00:04:57",
    "updatedAt": "2024-10-14T00:04:57"
  },
  {
    "projectName": "UrbanWorks",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "Redis"
    ],
    "teamSize": 6,
    "currentStage": "Prototype",
    "failureReason": "Market competition",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 12,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_19",
    "upvotes": 296,
    "views": 12386,
    "bookmarks": 324,
    "raisedHands": 167,
    "lastWorkedOn": "2025-02-08T02:04:57",
    "createdAt": "2024-11-03T02:04:57",
    "updatedAt": "2025-01-10T02:04:57"
  },
  {
    "projectName": "HyperHub",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "AWS",
      "Python",
      "FastAPI"
    ],
    "teamSize": 1,
    "currentStage": "Idea",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 23,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_9",
    "upvotes": 466,
    "views": 3676,
    "bookmarks": 292,
    "raisedHands": 164,
    "lastWorkedOn": "2025-09-17T06:04:57",
    "createdAt": "2025-09-04T06:04:57",
    "updatedAt": "2025-09-16T06:04:57"
  },
  {
    "projectName": "HiveFlow",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "Flask",
      "Express",
      "React",
      "MongoDB",
      "PostgreSQL",
      "FastAPI"
    ],
    "teamSize": 1,
    "currentStage": "Beta",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 22,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_5",
    "upvotes": 659,
    "views": 9416,
    "bookmarks": 41,
    "raisedHands": 178,
    "lastWorkedOn": "2025-12-20T18:04:57",
    "createdAt": "2025-09-02T18:04:57",
    "updatedAt": "2025-11-21T18:04:57"
  },
  {
    "projectName": "NovaFarm",
    "oneLiner": "A agritech startup focused on improving user experience through automation and data insights.",
    "domain": "AgriTech",
    "techStack": [
      "Next.js",
      "Docker",
      "PostgreSQL",
      "Express",
      "TypeScript"
    ],
    "teamSize": 8,
    "currentStage": "Pivoting",
    "failureReason": "Market competition",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 11,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_30",
    "upvotes": 473,
    "views": 12944,
    "bookmarks": 350,
    "raisedHands": 46,
    "lastWorkedOn": "2025-01-01T05:04:57",
    "createdAt": "2024-12-16T05:04:57",
    "updatedAt": "2024-12-30T05:04:57"
  },
  {
    "projectName": "QuantumDesk",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "React",
      "Flask",
      "TypeScript",
      "Tailwind CSS",
      "Python",
      "PostgreSQL"
    ],
    "teamSize": 5,
    "currentStage": "Prototype",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 23,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_2",
    "upvotes": 523,
    "views": 1851,
    "bookmarks": 48,
    "raisedHands": 108,
    "lastWorkedOn": "2025-09-12T08:04:57",
    "createdAt": "2025-07-13T08:04:57",
    "updatedAt": "2025-08-18T08:04:57"
  },
  {
    "projectName": "UrbanMind",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "MongoDB",
      "Python",
      "Tailwind CSS",
      "Next.js"
    ],
    "teamSize": 6,
    "currentStage": "Research",
    "failureReason": "Low user retention",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 12,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_2",
    "upvotes": 185,
    "views": 8945,
    "bookmarks": 19,
    "raisedHands": 106,
    "lastWorkedOn": "2025-10-28T04:04:57",
    "createdAt": "2025-06-29T04:04:57",
    "updatedAt": "2025-10-23T04:04:57"
  },
  {
    "projectName": "BrightPulse",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "FastAPI",
      "TypeScript",
      "Kubernetes",
      "Firebase"
    ],
    "teamSize": 6,
    "currentStage": "Idea",
    "failureReason": "Feature overload",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 9,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_7",
    "upvotes": 657,
    "views": 2446,
    "bookmarks": 196,
    "raisedHands": 114,
    "lastWorkedOn": "2025-08-05T09:04:57",
    "createdAt": "2025-03-27T09:04:57",
    "updatedAt": "2025-07-18T09:04:57"
  },
  {
    "projectName": "HyperPilot",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Next.js",
      "TypeScript",
      "Express",
      "React",
      "Tailwind CSS"
    ],
    "teamSize": 2,
    "currentStage": "Early Users",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 21,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 127,
    "views": 9355,
    "bookmarks": 174,
    "raisedHands": 34,
    "lastWorkedOn": "2024-12-15T10:04:57",
    "createdAt": "2024-08-25T10:04:57",
    "updatedAt": "2024-12-09T10:04:57"
  },
  {
    "projectName": "HiveLearn",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Redis",
      "TypeScript",
      "Firebase"
    ],
    "teamSize": 8,
    "currentStage": "Idea",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 10,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_30",
    "upvotes": 493,
    "views": 11140,
    "bookmarks": 110,
    "raisedHands": 52,
    "lastWorkedOn": "2025-07-30T21:04:57",
    "createdAt": "2025-03-13T21:04:57",
    "updatedAt": "2025-07-08T21:04:57"
  },
  {
    "projectName": "SwiftMind",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "FastAPI",
      "React",
      "AWS",
      "Express"
    ],
    "teamSize": 2,
    "currentStage": "Idea",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 9,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_1",
    "upvotes": 582,
    "views": 5057,
    "bookmarks": 345,
    "raisedHands": 162,
    "lastWorkedOn": "2025-07-07T12:04:57",
    "createdAt": "2025-06-01T12:04:57",
    "updatedAt": "2025-06-08T12:04:57"
  },
  {
    "projectName": "QuickTrack",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "TypeScript",
      "Next.js",
      "MongoDB"
    ],
    "teamSize": 6,
    "currentStage": "Idea",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 6,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 382,
    "views": 13487,
    "bookmarks": 143,
    "raisedHands": 122,
    "lastWorkedOn": "2026-07-08T11:04:57",
    "createdAt": "2026-03-17T11:04:57",
    "updatedAt": "2026-06-16T11:04:57"
  },
  {
    "projectName": "NovaDesk",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "Python",
      "FastAPI",
      "AWS",
      "Flask"
    ],
    "teamSize": 1,
    "currentStage": "Research",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 3,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_18",
    "upvotes": 579,
    "views": 14483,
    "bookmarks": 125,
    "raisedHands": 12,
    "lastWorkedOn": "2026-07-22T07:04:57",
    "createdAt": "2026-04-05T07:04:57",
    "updatedAt": "2026-07-13T07:04:57"
  },
  {
    "projectName": "SmartTrack",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Express",
      "Redis",
      "Next.js",
      "Python",
      "PostgreSQL",
      "Kubernetes"
    ],
    "teamSize": 6,
    "currentStage": "Beta",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 18,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_13",
    "upvotes": 317,
    "views": 5425,
    "bookmarks": 261,
    "raisedHands": 74,
    "lastWorkedOn": "2026-02-23T02:04:57",
    "createdAt": "2025-11-25T02:04:57",
    "updatedAt": "2026-02-03T02:04:57"
  },
  {
    "projectName": "VisionMind",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Docker",
      "FastAPI",
      "Flask"
    ],
    "teamSize": 3,
    "currentStage": "Research",
    "failureReason": "Technical complexity",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 17,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_25",
    "upvotes": 478,
    "views": 6110,
    "bookmarks": 327,
    "raisedHands": 59,
    "lastWorkedOn": "2025-09-26T05:04:57",
    "createdAt": "2025-06-17T05:04:57",
    "updatedAt": "2025-09-15T05:04:57"
  },
  {
    "projectName": "PulseWorks",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Python",
      "Flask",
      "TypeScript",
      "AWS",
      "Node.js"
    ],
    "teamSize": 4,
    "currentStage": "Research",
    "failureReason": "Market competition",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 21,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_12",
    "upvotes": 21,
    "views": 172,
    "bookmarks": 340,
    "raisedHands": 22,
    "lastWorkedOn": "2025-07-15T05:04:57",
    "createdAt": "2025-07-05T05:04:57",
    "updatedAt": "2025-07-12T05:04:57"
  },
  {
    "projectName": "NexusCart",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "Express",
      "Firebase",
      "Flask",
      "PostgreSQL",
      "FastAPI",
      "Redis"
    ],
    "teamSize": 7,
    "currentStage": "Idea",
    "failureReason": "No clear product-market fit",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 6,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_16",
    "upvotes": 483,
    "views": 1461,
    "bookmarks": 276,
    "raisedHands": 165,
    "lastWorkedOn": "2024-09-26T00:04:57",
    "createdAt": "2024-09-01T00:04:57",
    "updatedAt": "2024-09-14T00:04:57"
  },
  {
    "projectName": "NexusTrack",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "Docker",
      "Flask",
      "Firebase",
      "MongoDB",
      "FastAPI"
    ],
    "teamSize": 7,
    "currentStage": "Pivoting",
    "failureReason": "Technical complexity",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 12,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_22",
    "upvotes": 618,
    "views": 6645,
    "bookmarks": 262,
    "raisedHands": 67,
    "lastWorkedOn": "2026-07-25T11:04:57",
    "createdAt": "2026-06-10T13:04:57",
    "updatedAt": "2026-09-20T13:04:57"
  },
  {
    "projectName": "EchoWorks",
    "oneLiner": "A agritech startup focused on improving user experience through automation and data insights.",
    "domain": "AgriTech",
    "techStack": [
      "Express",
      "Kubernetes",
      "TypeScript",
      "MongoDB",
      "Next.js",
      "Firebase"
    ],
    "teamSize": 7,
    "currentStage": "MVP",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 15,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_14",
    "upvotes": 684,
    "views": 7266,
    "bookmarks": 118,
    "raisedHands": 43,
    "lastWorkedOn": "2025-10-13T15:04:57",
    "createdAt": "2025-06-16T15:04:57",
    "updatedAt": "2025-10-08T15:04:57"
  },
  {
    "projectName": "BrightTrack",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "Next.js",
      "FastAPI",
      "Python",
      "MongoDB",
      "AWS",
      "Firebase"
    ],
    "teamSize": 4,
    "currentStage": "Prototype",
    "failureReason": "Technical complexity",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 2,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_7",
    "upvotes": 292,
    "views": 9604,
    "bookmarks": 119,
    "raisedHands": 146,
    "lastWorkedOn": "2026-02-16T08:04:57",
    "createdAt": "2025-12-19T08:04:57",
    "updatedAt": "2026-02-08T08:04:57"
  },
  {
    "projectName": "NexusLearn",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "Redis",
      "React",
      "AWS"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 20,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_11",
    "upvotes": 567,
    "views": 3470,
    "bookmarks": 183,
    "raisedHands": 24,
    "lastWorkedOn": "2025-03-02T20:04:57",
    "createdAt": "2025-01-29T20:04:57",
    "updatedAt": "2025-03-02T20:04:57"
  },
  {
    "projectName": "OrbitGuard",
    "oneLiner": "A iot startup focused on improving user experience through automation and data insights.",
    "domain": "IoT",
    "techStack": [
      "React",
      "Firebase",
      "Flask",
      "AWS",
      "Docker"
    ],
    "teamSize": 4,
    "currentStage": "Idea",
    "failureReason": "Low user retention",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 17,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_7",
    "upvotes": 478,
    "views": 14174,
    "bookmarks": 116,
    "raisedHands": 25,
    "lastWorkedOn": "2026-04-30T14:04:57",
    "createdAt": "2026-04-01T14:04:57",
    "updatedAt": "2026-04-15T14:04:57"
  },
  {
    "projectName": "UrbanGuard",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "MongoDB",
      "Kubernetes",
      "Tailwind CSS"
    ],
    "teamSize": 8,
    "currentStage": "Research",
    "failureReason": "Feature overload",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 15,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_3",
    "upvotes": 29,
    "views": 6718,
    "bookmarks": 205,
    "raisedHands": 6,
    "lastWorkedOn": "2025-03-10T11:04:57",
    "createdAt": "2025-02-25T11:04:57",
    "updatedAt": "2025-03-06T11:04:57"
  },
  {
    "projectName": "PulseBridge",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Firebase",
      "Python",
      "FastAPI",
      "AWS",
      "Docker"
    ],
    "teamSize": 3,
    "currentStage": "Early Users",
    "failureReason": "Low user retention",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 5,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_21",
    "upvotes": 225,
    "views": 14201,
    "bookmarks": 200,
    "raisedHands": 96,
    "lastWorkedOn": "2025-05-30T19:04:57",
    "createdAt": "2025-03-04T19:04:57",
    "updatedAt": "2025-05-24T19:04:57"
  },
  {
    "projectName": "NovaWorks",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "PostgreSQL",
      "Next.js",
      "Flask",
      "AWS",
      "Express",
      "React"
    ],
    "teamSize": 7,
    "currentStage": "Beta",
    "failureReason": "Market competition",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 14,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_27",
    "upvotes": 388,
    "views": 1181,
    "bookmarks": 56,
    "raisedHands": 32,
    "lastWorkedOn": "2026-01-19T01:04:57",
    "createdAt": "2026-01-01T01:04:57",
    "updatedAt": "2026-01-09T01:04:57"
  },
  {
    "projectName": "SmartCart",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Firebase",
      "FastAPI",
      "Flask",
      "Next.js"
    ],
    "teamSize": 5,
    "currentStage": "Pivoting",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 3,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_15",
    "upvotes": 644,
    "views": 13768,
    "bookmarks": 242,
    "raisedHands": 163,
    "lastWorkedOn": "2025-07-01T03:04:57",
    "createdAt": "2025-05-03T03:04:57",
    "updatedAt": "2025-06-03T03:04:57"
  },
  {
    "projectName": "PulsePilot",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "TypeScript",
      "FastAPI",
      "Tailwind CSS",
      "AWS",
      "Node.js"
    ],
    "teamSize": 3,
    "currentStage": "Idea",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 5,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_21",
    "upvotes": 463,
    "views": 6198,
    "bookmarks": 86,
    "raisedHands": 96,
    "lastWorkedOn": "2025-07-11T18:04:57",
    "createdAt": "2025-06-27T18:04:57",
    "updatedAt": "2025-06-30T18:04:57"
  },
  {
    "projectName": "GreenPulse",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "React",
      "PostgreSQL",
      "Next.js",
      "Tailwind CSS",
      "Kubernetes"
    ],
    "teamSize": 2,
    "currentStage": "Idea",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 16,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_9",
    "upvotes": 263,
    "views": 1155,
    "bookmarks": 191,
    "raisedHands": 126,
    "lastWorkedOn": "2026-06-04T03:04:57",
    "createdAt": "2026-03-31T03:04:57",
    "updatedAt": "2026-05-17T03:04:57"
  },
  {
    "projectName": "UrbanMind",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "PostgreSQL",
      "TypeScript",
      "React",
      "Node.js",
      "FastAPI"
    ],
    "teamSize": 8,
    "currentStage": "Research",
    "failureReason": "Low user retention",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 20,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_16",
    "upvotes": 465,
    "views": 683,
    "bookmarks": 46,
    "raisedHands": 27,
    "lastWorkedOn": "2025-10-02T21:04:57",
    "createdAt": "2025-08-29T21:04:57",
    "updatedAt": "2025-09-28T21:04:57"
  },
  {
    "projectName": "UrbanBridge",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Express",
      "Kubernetes",
      "Docker"
    ],
    "teamSize": 5,
    "currentStage": "MVP",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 10,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_22",
    "upvotes": 170,
    "views": 11350,
    "bookmarks": 346,
    "raisedHands": 76,
    "lastWorkedOn": "2026-01-18T16:04:57",
    "createdAt": "2025-11-13T16:04:57",
    "updatedAt": "2025-12-20T16:04:57"
  },
  {
    "projectName": "GreenDesk",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Kubernetes",
      "MongoDB",
      "Firebase",
      "PostgreSQL",
      "React",
      "Python"
    ],
    "teamSize": 2,
    "currentStage": "Pivoting",
    "failureReason": "Low user retention",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 20,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_16",
    "upvotes": 243,
    "views": 463,
    "bookmarks": 298,
    "raisedHands": 146,
    "lastWorkedOn": "2024-12-26T06:04:57",
    "createdAt": "2024-10-27T06:04:57",
    "updatedAt": "2024-11-26T06:04:57"
  },
  {
    "projectName": "SwiftLink",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Firebase",
      "Docker",
      "Python",
      "Redis",
      "React",
      "Kubernetes"
    ],
    "teamSize": 8,
    "currentStage": "Beta",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 23,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_19",
    "upvotes": 589,
    "views": 942,
    "bookmarks": 60,
    "raisedHands": 145,
    "lastWorkedOn": "2025-01-11T22:04:57",
    "createdAt": "2024-11-05T22:04:57",
    "updatedAt": "2024-12-28T22:04:57"
  },
  {
    "projectName": "CloudHealth",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "Firebase",
      "MongoDB",
      "Kubernetes"
    ],
    "teamSize": 5,
    "currentStage": "Early Users",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 7,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_19",
    "upvotes": 697,
    "views": 34,
    "bookmarks": 301,
    "raisedHands": 97,
    "lastWorkedOn": "2026-07-25T11:04:57",
    "createdAt": "2026-04-29T23:04:57",
    "updatedAt": "2026-08-10T23:04:57"
  },
  {
    "projectName": "BrightGuard",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "PostgreSQL",
      "MongoDB",
      "Firebase"
    ],
    "teamSize": 5,
    "currentStage": "Pivoting",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 10,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_24",
    "upvotes": 148,
    "views": 3399,
    "bookmarks": 249,
    "raisedHands": 112,
    "lastWorkedOn": "2025-05-06T22:04:57",
    "createdAt": "2025-02-06T22:04:57",
    "updatedAt": "2025-04-23T22:04:57"
  },
  {
    "projectName": "VisionPilot",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "AWS",
      "Redis",
      "Tailwind CSS",
      "Next.js"
    ],
    "teamSize": 8,
    "currentStage": "Beta",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 24,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_15",
    "upvotes": 232,
    "views": 2523,
    "bookmarks": 313,
    "raisedHands": 52,
    "lastWorkedOn": "2025-12-06T05:04:57",
    "createdAt": "2025-11-04T05:04:57",
    "updatedAt": "2025-11-14T05:04:57"
  },
  {
    "projectName": "OrbitSense",
    "oneLiner": "A climatetech startup focused on improving user experience through automation and data insights.",
    "domain": "ClimateTech",
    "techStack": [
      "FastAPI",
      "Flask",
      "Kubernetes",
      "Firebase",
      "Express"
    ],
    "teamSize": 2,
    "currentStage": "Prototype",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 10,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_17",
    "upvotes": 516,
    "views": 7726,
    "bookmarks": 334,
    "raisedHands": 134,
    "lastWorkedOn": "2025-07-27T02:04:57",
    "createdAt": "2025-06-16T02:04:57",
    "updatedAt": "2025-07-12T02:04:57"
  },
  {
    "projectName": "CloudSense",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Python",
      "React",
      "FastAPI",
      "Kubernetes",
      "Redis",
      "Flask"
    ],
    "teamSize": 3,
    "currentStage": "MVP",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 5,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_5",
    "upvotes": 51,
    "views": 8527,
    "bookmarks": 65,
    "raisedHands": 6,
    "lastWorkedOn": "2024-09-24T07:04:57",
    "createdAt": "2024-08-27T07:04:57",
    "updatedAt": "2024-09-09T07:04:57"
  },
  {
    "projectName": "CloudMind",
    "oneLiner": "A agritech startup focused on improving user experience through automation and data insights.",
    "domain": "AgriTech",
    "techStack": [
      "AWS",
      "Docker",
      "Flask",
      "TypeScript",
      "FastAPI"
    ],
    "teamSize": 1,
    "currentStage": "Idea",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_2",
    "upvotes": 388,
    "views": 12719,
    "bookmarks": 347,
    "raisedHands": 163,
    "lastWorkedOn": "2026-06-16T13:04:57",
    "createdAt": "2026-05-03T13:04:57",
    "updatedAt": "2026-05-17T13:04:57"
  },
  {
    "projectName": "PulseBridge",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "TypeScript",
      "FastAPI",
      "Tailwind CSS",
      "PostgreSQL"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 4,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_4",
    "upvotes": 264,
    "views": 1084,
    "bookmarks": 23,
    "raisedHands": 144,
    "lastWorkedOn": "2025-05-02T12:04:57",
    "createdAt": "2025-01-31T12:04:57",
    "updatedAt": "2025-04-05T12:04:57"
  },
  {
    "projectName": "VisionDesk",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "Firebase",
      "Docker",
      "MongoDB"
    ],
    "teamSize": 8,
    "currentStage": "Idea",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 3,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_17",
    "upvotes": 543,
    "views": 13617,
    "bookmarks": 14,
    "raisedHands": 96,
    "lastWorkedOn": "2025-11-04T10:04:57",
    "createdAt": "2025-08-01T10:04:57",
    "updatedAt": "2025-10-10T10:04:57"
  },
  {
    "projectName": "VisionCart",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "FastAPI",
      "TypeScript",
      "Firebase",
      "Tailwind CSS",
      "Kubernetes"
    ],
    "teamSize": 3,
    "currentStage": "MVP",
    "failureReason": "Feature overload",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 22,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_2",
    "upvotes": 31,
    "views": 3049,
    "bookmarks": 313,
    "raisedHands": 104,
    "lastWorkedOn": "2026-07-24T11:04:57",
    "createdAt": "2026-05-02T01:04:57",
    "updatedAt": "2026-08-25T01:04:57"
  },
  {
    "projectName": "FusionScale",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "MongoDB",
      "Kubernetes",
      "Node.js"
    ],
    "teamSize": 1,
    "currentStage": "MVP",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 2,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_11",
    "upvotes": 242,
    "views": 1310,
    "bookmarks": 97,
    "raisedHands": 149,
    "lastWorkedOn": "2026-04-07T21:04:57",
    "createdAt": "2025-12-24T21:04:57",
    "updatedAt": "2026-03-23T21:04:57"
  },
  {
    "projectName": "PixelFlow",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Flask",
      "Kubernetes",
      "Docker",
      "TypeScript",
      "PostgreSQL"
    ],
    "teamSize": 1,
    "currentStage": "MVP",
    "failureReason": "Feature overload",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 11,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_16",
    "upvotes": 658,
    "views": 10934,
    "bookmarks": 115,
    "raisedHands": 167,
    "lastWorkedOn": "2026-07-25T11:04:57",
    "createdAt": "2026-06-14T15:04:57",
    "updatedAt": "2026-09-28T15:04:57"
  },
  {
    "projectName": "VisionCart",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "MongoDB",
      "Tailwind CSS",
      "TypeScript"
    ],
    "teamSize": 3,
    "currentStage": "Beta",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 17,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_13",
    "upvotes": 586,
    "views": 739,
    "bookmarks": 310,
    "raisedHands": 161,
    "lastWorkedOn": "2025-03-17T07:04:57",
    "createdAt": "2024-12-25T07:04:57",
    "updatedAt": "2025-02-15T07:04:57"
  },
  {
    "projectName": "BrightGrid",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Docker",
      "TypeScript",
      "MongoDB",
      "Flask"
    ],
    "teamSize": 6,
    "currentStage": "Early Users",
    "failureReason": "No clear product-market fit",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 6,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_14",
    "upvotes": 705,
    "views": 9803,
    "bookmarks": 94,
    "raisedHands": 157,
    "lastWorkedOn": "2026-07-23T11:04:57",
    "createdAt": "2026-06-09T04:04:57",
    "updatedAt": "2026-08-28T04:04:57"
  },
  {
    "projectName": "VisionMind",
    "oneLiner": "A cybersecurity startup focused on improving user experience through automation and data insights.",
    "domain": "Cybersecurity",
    "techStack": [
      "Docker",
      "Python",
      "TypeScript"
    ],
    "teamSize": 6,
    "currentStage": "Beta",
    "failureReason": "Funding constraints",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 3,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_21",
    "upvotes": 318,
    "views": 1906,
    "bookmarks": 289,
    "raisedHands": 148,
    "lastWorkedOn": "2025-06-29T03:04:57",
    "createdAt": "2025-03-20T03:04:57",
    "updatedAt": "2025-05-30T03:04:57"
  },
  {
    "projectName": "BrightLink",
    "oneLiner": "A healthtech startup focused on improving user experience through automation and data insights.",
    "domain": "HealthTech",
    "techStack": [
      "Flask",
      "FastAPI",
      "Python",
      "React"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 7,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_22",
    "upvotes": 151,
    "views": 2253,
    "bookmarks": 153,
    "raisedHands": 41,
    "lastWorkedOn": "2025-07-01T23:04:57",
    "createdAt": "2025-05-30T23:04:57",
    "updatedAt": "2025-06-19T23:04:57"
  },
  {
    "projectName": "HyperBridge",
    "oneLiner": "A ai startup focused on improving user experience through automation and data insights.",
    "domain": "AI",
    "techStack": [
      "Redis",
      "React",
      "Kubernetes",
      "FastAPI",
      "Next.js"
    ],
    "teamSize": 1,
    "currentStage": "MVP",
    "failureReason": "Customer acquisition cost too high",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 11,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_9",
    "upvotes": 193,
    "views": 8984,
    "bookmarks": 273,
    "raisedHands": 151,
    "lastWorkedOn": "2025-10-24T05:04:57",
    "createdAt": "2025-07-02T05:04:57",
    "updatedAt": "2025-09-26T05:04:57"
  },
  {
    "projectName": "CloudBridge",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Express",
      "PostgreSQL",
      "Next.js",
      "MongoDB"
    ],
    "teamSize": 4,
    "currentStage": "MVP",
    "failureReason": "Team bandwidth",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 19,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_20",
    "upvotes": 207,
    "views": 12800,
    "bookmarks": 170,
    "raisedHands": 98,
    "lastWorkedOn": "2025-11-18T12:04:57",
    "createdAt": "2025-10-15T12:04:57",
    "updatedAt": "2025-10-26T12:04:57"
  },
  {
    "projectName": "PixelFlow",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "FastAPI",
      "MongoDB",
      "Firebase",
      "Node.js",
      "TypeScript",
      "AWS"
    ],
    "teamSize": 3,
    "currentStage": "MVP",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 21,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_25",
    "upvotes": 676,
    "views": 14931,
    "bookmarks": 175,
    "raisedHands": 19,
    "lastWorkedOn": "2026-07-24T11:04:57",
    "createdAt": "2026-05-31T10:04:57",
    "updatedAt": "2026-09-28T10:04:57"
  },
  {
    "projectName": "GreenHealth",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "React",
      "Firebase",
      "Redis",
      "PostgreSQL",
      "Kubernetes",
      "AWS"
    ],
    "teamSize": 8,
    "currentStage": "Idea",
    "failureReason": "Regulatory uncertainty",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 19,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_20",
    "upvotes": 32,
    "views": 3608,
    "bookmarks": 249,
    "raisedHands": 148,
    "lastWorkedOn": "2026-05-19T21:04:57",
    "createdAt": "2026-05-04T21:04:57",
    "updatedAt": "2026-05-16T21:04:57"
  },
  {
    "projectName": "HyperHealth",
    "oneLiner": "A saas startup focused on improving user experience through automation and data insights.",
    "domain": "SaaS",
    "techStack": [
      "Express",
      "Docker",
      "Kubernetes",
      "MongoDB",
      "FastAPI",
      "React"
    ],
    "teamSize": 2,
    "currentStage": "Idea",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 3,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_22",
    "upvotes": 343,
    "views": 3827,
    "bookmarks": 305,
    "raisedHands": 64,
    "lastWorkedOn": "2026-04-21T07:04:57",
    "createdAt": "2025-12-05T07:04:57",
    "updatedAt": "2026-03-23T07:04:57"
  },
  {
    "projectName": "PulseHub",
    "oneLiner": "A e-commerce startup focused on improving user experience through automation and data insights.",
    "domain": "E-commerce",
    "techStack": [
      "FastAPI",
      "Node.js",
      "Kubernetes"
    ],
    "teamSize": 2,
    "currentStage": "Pivoting",
    "failureReason": "Feature overload",
    "developmentMethodology": "Scrum",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_26",
    "upvotes": 374,
    "views": 4100,
    "bookmarks": 8,
    "raisedHands": 142,
    "lastWorkedOn": "2025-07-09T08:04:57",
    "createdAt": "2025-05-15T08:04:57",
    "updatedAt": "2025-06-12T08:04:57"
  },
  {
    "projectName": "HiveMind",
    "oneLiner": "A agritech startup focused on improving user experience through automation and data insights.",
    "domain": "AgriTech",
    "techStack": [
      "Next.js",
      "Firebase",
      "Tailwind CSS",
      "PostgreSQL",
      "Redis",
      "Express"
    ],
    "teamSize": 7,
    "currentStage": "MVP",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Kanban",
    "timeSpent": {
      "value": 16,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_29",
    "upvotes": 150,
    "views": 1778,
    "bookmarks": 53,
    "raisedHands": 133,
    "lastWorkedOn": "2025-05-26T00:04:57",
    "createdAt": "2025-03-13T00:04:57",
    "updatedAt": "2025-04-29T00:04:57"
  },
  {
    "projectName": "QuickLearn",
    "oneLiner": "A edtech startup focused on improving user experience through automation and data insights.",
    "domain": "EdTech",
    "techStack": [
      "Kubernetes",
      "Express",
      "Next.js",
      "FastAPI",
      "TypeScript",
      "Tailwind CSS"
    ],
    "teamSize": 6,
    "currentStage": "Early Users",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 2,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_26",
    "upvotes": 485,
    "views": 5839,
    "bookmarks": 211,
    "raisedHands": 34,
    "lastWorkedOn": "2025-06-27T13:04:57",
    "createdAt": "2025-05-05T13:04:57",
    "updatedAt": "2025-06-22T13:04:57"
  },
  {
    "projectName": "PixelGrid",
    "oneLiner": "A gaming startup focused on improving user experience through automation and data insights.",
    "domain": "Gaming",
    "techStack": [
      "Firebase",
      "Docker",
      "React"
    ],
    "teamSize": 8,
    "currentStage": "Pivoting",
    "failureReason": "Co-founder left",
    "developmentMethodology": "Agile",
    "timeSpent": {
      "value": 13,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_15",
    "upvotes": 473,
    "views": 10344,
    "bookmarks": 106,
    "raisedHands": 98,
    "lastWorkedOn": "2026-06-06T12:04:57",
    "createdAt": "2026-04-13T12:04:57",
    "updatedAt": "2026-05-30T12:04:57"
  },
  {
    "projectName": "CoreCart",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "FastAPI",
      "Tailwind CSS",
      "PostgreSQL",
      "Firebase",
      "Python",
      "Kubernetes"
    ],
    "teamSize": 7,
    "currentStage": "Beta",
    "failureReason": "Feature overload",
    "developmentMethodology": "Lean Startup",
    "timeSpent": {
      "value": 21,
      "unit": "months"
    },
    "isAnonymous": false,
    "submittedBy": "User_23",
    "upvotes": 132,
    "views": 1270,
    "bookmarks": 147,
    "raisedHands": 127,
    "lastWorkedOn": "2025-10-16T12:04:57",
    "createdAt": "2025-06-10T12:04:57",
    "updatedAt": "2025-10-02T12:04:57"
  },
  {
    "projectName": "SmartDrive",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Firebase",
      "React",
      "Python",
      "Node.js",
      "TypeScript"
    ],
    "teamSize": 3,
    "currentStage": "Idea",
    "failureReason": "Market competition",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 9,
      "unit": "weeks"
    },
    "isAnonymous": false,
    "submittedBy": "User_9",
    "upvotes": 108,
    "views": 5776,
    "bookmarks": 269,
    "raisedHands": 90,
    "lastWorkedOn": "2024-09-30T22:04:57",
    "createdAt": "2024-09-11T22:04:57",
    "updatedAt": "2024-09-17T22:04:57"
  },
  {
    "projectName": "SwiftLearn",
    "oneLiner": "A fintech startup focused on improving user experience through automation and data insights.",
    "domain": "FinTech",
    "techStack": [
      "Kubernetes",
      "Firebase",
      "Express"
    ],
    "teamSize": 2,
    "currentStage": "Beta",
    "failureReason": "Pivot in progress",
    "developmentMethodology": "Rapid Prototyping",
    "timeSpent": {
      "value": 11,
      "unit": "weeks"
    },
    "isAnonymous": true,
    "submittedBy": "User_10",
    "upvotes": 664,
    "views": 6297,
    "bookmarks": 25,
    "raisedHands": 166,
    "lastWorkedOn": "2026-03-28T10:04:57",
    "createdAt": "2025-12-04T10:04:57",
    "updatedAt": "2026-03-05T10:04:57"
  },
  {
    "projectName": "VisionGrid",
    "oneLiner": "A travel startup focused on improving user experience through automation and data insights.",
    "domain": "Travel",
    "techStack": [
      "Redis",
      "Tailwind CSS",
      "Node.js"
    ],
    "teamSize": 3,
    "currentStage": "Beta",
    "failureReason": "Paused due to academics",
    "developmentMethodology": "Waterfall",
    "timeSpent": {
      "value": 9,
      "unit": "months"
    },
    "isAnonymous": true,
    "submittedBy": "User_9",
    "upvotes": 369,
    "views": 11743,
    "bookmarks": 310,
    "raisedHands": 18,
    "lastWorkedOn": "2026-04-04T20:04:57",
    "createdAt": "2025-12-01T20:04:57",
    "updatedAt": "2026-03-13T20:04:57"
  }
  ];

// ── Map seed data to schema-valid values ──────────────────────────────────────

function mapDomain(d) {
  const map = {
    healthtech: "other", medtech: "other", biotech: "other",
    edtech: "other", legaltech: "other", fintech: "other",
    ai: "ml", "machine learning": "ml", "data science": "ml",
    iot: "hardware", hardware: "hardware", robotics: "hardware",
    mobile: "mobile", ios: "mobile", android: "mobile",
    gaming: "game", gamedev: "game", game: "game",
    web: "web", saas: "web", ecommerce: "web", "e-commerce": "web",
    devtools: "web", productivity: "web", social: "web",
    climatetech: "other", agritech: "other", cybersecurity: "other",
    travel: "other", blockchain: "other",
  };
  const key = (d || "").toLowerCase().replace(/[^a-z]/g, "");
  return map[key] || "other";
}

function mapTeamSize(n) {
  const num = Number(n);
  if (num <= 1) return "solo";
  if (num <= 3) return "2-3";
  return "4+";
}

function mapStage(s) {
  const lower = (s || "").toLowerCase();
  if (lower.includes("idea")) return "Idea only";
  if (lower.includes("proto")) return "Prototype";
  if (lower.includes("mvp") || lower.includes("50") || lower.includes("beta")) return "50% done";
  if (lower.includes("almost") || lower.includes("early user") || lower.includes("pivot") || lower.includes("research")) return "Almost complete";
  if (lower.includes("launch") || lower.includes("ship") || lower.includes("publish")) return "Launched but abandoned";
  return "50% done";
}

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Draft.deleteMany({});
    console.log("🗑️  Cleared existing burials");

    // Transform each record so it passes Mongoose validation
    const validBurials = fakeBurials.map((b) => ({
      projectName: b.projectName,
      oneLiner: b.oneLiner,
      domain: mapDomain(b.domain),
      techStack: b.techStack || [],
      teamSize: mapTeamSize(b.teamSize),
      currentStage: mapStage(b.currentStage),
      failureReason: b.failureReason || "Unknown",
      developmentMethodology: b.developmentMethodology || "",
      timeSpent: {
        value: b.timeSpent?.value || 1,
        unit: ["days", "weeks", "months"].includes(b.timeSpent?.unit)
          ? b.timeSpent.unit
          : "weeks",
      },
      isAnonymous: !!b.isAnonymous,
      // submittedBy omitted — seed strings are not valid ObjectIds
      upvotes: b.upvotes || 0,
      views: b.views || 0,
      bookmarks: b.bookmarks || 0,
      lastWorkedOn: b.lastWorkedOn ? new Date(b.lastWorkedOn) : null,
      // raisedHands must be an array of objects, not a number
      raisedHands: [],
    }));

    await Draft.insertMany(validBurials);
    console.log(`🌱 Seeded ${validBurials.length} fake burials`);

    mongoose.connection.close();
    console.log("🔌 Connection closed");
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seedDB();
