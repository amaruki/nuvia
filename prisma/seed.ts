import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

// Admin user data with different admin roles
const adminUsers = [
  {
    username: 'superadmin',
    email: 'admin@nuvia.com',
    password: 'Admin123!@#', // Change this in production
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin' as const,
    bio: 'System administrator with full access to all platform features',
    externalLinks: {
      linkedin: 'https://linkedin.com/in/nuvia-admin',
      website: 'https://nuvia.com'
    }
  },
  {
    username: 'admin',
    email: 'administrator@nuvia.com',
    password: 'Admin123!@#', // Change this in production
    firstName: 'Platform',
    lastName: 'Administrator',
    role: 'admin' as const,
    bio: 'Platform administrator managing daily operations and user management',
    externalLinks: {
      linkedin: 'https://linkedin.com/in/nuvia-platform-admin',
      website: 'https://nuvia.com'
    }
  },
  {
    username: 'staff_manager',
    email: 'staff@nuvia.com',
    password: 'Admin123!@#', // Change this in production
    firstName: 'Staff',
    lastName: 'Manager',
    role: 'staff' as const,
    bio: 'Operations staff managing events and member services',
    externalLinks: {
      linkedin: 'https://linkedin.com/in/nuvia-staff',
      website: 'https://nuvia.com'
    }
  },
  {
    username: 'treasurer',
    email: 'finance@nuvia.com',
    password: 'Admin123!@#', // Change this in production
    firstName: 'Finance',
    lastName: 'Manager',
    role: 'treasurer' as const,
    bio: 'Financial manager overseeing billing and transactions',
    externalLinks: {
      linkedin: 'https://linkedin.com/in/nuvia-treasurer',
      website: 'https://nuvia.com'
    }
  },
  {
    username: 'content_moderator',
    email: 'moderator@nuvia.com',
    password: 'Admin123!@#', // Change this in production
    firstName: 'Content',
    lastName: 'Moderator',
    role: 'moderator' as const,
    bio: 'Content moderator managing forum posts and community content',
    externalLinks: {
      linkedin: 'https://linkedin.com/in/nuvia-moderator',
      website: 'https://nuvia.com'
    }
  }
];

// Helper function to clean up existing user data
async function cleanupExistingUser(email: string): Promise<void> {
  try {
    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`🗑️  Cleaning up existing user: ${email}`);

      // Delete related records in order (due to foreign key constraints)
      await prisma.userLoginActivity.deleteMany({
        where: { userId: existingUser.id }
      });

      await prisma.session.deleteMany({
        where: { userId: existingUser.id }
      });

      await prisma.account.deleteMany({
        where: { userId: existingUser.id }
      });

      await prisma.user.delete({
        where: { id: existingUser.id }
      });

      console.log(`✅ Successfully cleaned up user: ${email}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up user ${email}:`, error);
    throw error;
  }
}

// Helper function to create user using Better Auth API
async function createAdminUser(userData: typeof adminUsers[0]): Promise<void> {
  try {
    // Clean up any existing user data first
    await cleanupExistingUser(userData.email);

    console.log(`🔧 Creating admin user: ${userData.email}`);

    // Create user using Better Auth's signUpEmail API
    const result = await auth.api.signUpEmail({
      body: {
        name: `${userData.firstName} ${userData.lastName}`, // required
        email: userData.email, // required
        password: userData.password, // required
        username: userData.username, // required by our Better Auth config
        // callbackURL not needed for seed
      },
    });

    if (result.error) {
      throw new Error(`Better Auth sign up failed: ${result.error.message}`);
    }

    console.log(`✅ Created Better Auth user: ${userData.email}`);

    // Get the created user to update with additional fields
    const createdUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!createdUser) {
      throw new Error(`User not found after creation: ${userData.email}`);
    }

    // Update user with additional fields that Better Auth doesn't handle
    await prisma.user.update({
      where: { id: createdUser.id },
      data: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio,
        externalLinks: userData.externalLinks,
        role: userData.role,
        emailVerified: true, // Admins start with verified email
      }
    });

    // Create login activity record
    await prisma.userLoginActivity.create({
      data: {
        userId: createdUser.id,
        ipAddress: '127.0.0.1', // Localhost
        userAgent: 'Seed Script v1.0',
        deviceType: 'desktop',
        location: 'Local',
        loginAt: new Date(),
        successful: true
      }
    });

    console.log(`✅ Updated admin user with role and additional fields: ${userData.email} (${userData.role})`);

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting admin user seeding...\n');

  try {
    console.log('📋 Creating admin users using Better Auth API...\n');

    // Create each admin user
    for (const adminUser of adminUsers) {
      await createAdminUser(adminUser);
    }

    console.log('\n✅ Admin user seeding completed successfully!');

    // Summary
    const totalAdmins = await prisma.user.count({
      where: {
        role: {
          in: ['superadmin', 'admin', 'staff', 'treasurer', 'moderator']
        }
      }
    });

    console.log(`📊 Total admin users in database: ${totalAdmins}`);

    // Display admin accounts
    const adminAccounts = await prisma.user.findMany({
      where: {
        role: {
          in: ['superadmin', 'admin', 'staff', 'treasurer', 'moderator']
        }
      },
      include: {
        accounts: {
          select: {
            providerId: true,
            password: true
          }
        },
        sessions: {
          select: {
            token: true,
            expiresAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log('\n📋 Admin Accounts Created:');
    adminAccounts.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Email Verified: ${admin.emailVerified ? '✅' : '❌'}`);
      console.log(`   Better Auth Accounts: ${admin.accounts.length}`);
      console.log(`   Sessions: ${admin.sessions.length}`);
      console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Important security warning
    console.log('⚠️  SECURITY WARNING:');
    console.log('   - All admin accounts use temporary passwords!');
    console.log('   - Change passwords immediately after first login!');
    console.log('   - Update email addresses to real admin emails!');
    console.log('   - Remove or secure this seed script!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: Use any of the emails above');
    console.log('   Password: Admin123!@#');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });