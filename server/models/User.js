const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
  type: String,
  required: false,
  minlength: 6,
  select: false,
},
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    googleId: { type: String, default: '' },
provider: {
  type: String,
  enum: ['local', 'google'],
  default: 'local',
},

emailVerified: { type: Boolean, default: false },
lastLogin: { type: Date, default: Date.now },
    username: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    skills: { type: [String], default: [] },

// Social connections
followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Hash the password before saving, only if it changed
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash if a doc is serialized to JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
