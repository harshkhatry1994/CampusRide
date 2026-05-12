import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id, displayName, emails, photos } = profile;
          const email = emails[0].value;
          const avatar = photos[0]?.value || '';

          let user = await User.findOne({ email });

          if (user) {
            // Update googleId if it's a new link
            if (!user.googleId) {
              user.googleId = id;
              if (avatar && !user.avatar) user.avatar = avatar;
              await user.save();
            }
            return done(null, user);
          }

          // Create new user if not found
          user = await User.create({
            name: displayName,
            email,
            googleId: id,
            avatar,
            role: 'customer',
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
