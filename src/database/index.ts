import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    language TEXT DEFAULT 'ru',
    log_channel_id TEXT,
    quarantine_role_id TEXT,
    max_warnings INTEGER DEFAULT 3,
    enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS whitelist (
    guild_id TEXT,
    user_id TEXT,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS groups (
    guild_id TEXT,
    role_id TEXT,
    PRIMARY KEY (guild_id, role_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    guild_id TEXT,
    user_id TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS antibot_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    action TEXT DEFAULT 'kick',
    log_channel_id TEXT
  );

  CREATE TABLE IF NOT EXISTS antibot_whitelist (
    guild_id TEXT,
    bot_id TEXT,
    PRIMARY KEY (guild_id, bot_id)
  );

  CREATE TABLE IF NOT EXISTS antilink_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    action TEXT DEFAULT 'delete',
    log_channel_id TEXT
  );

  CREATE TABLE IF NOT EXISTS antilink_whitelist_channels (
    guild_id TEXT,
    channel_id TEXT,
    PRIMARY KEY (guild_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS antispam_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    max_messages INTEGER DEFAULT 5,
    time_window INTEGER DEFAULT 5,
    action TEXT DEFAULT 'mute',
    mute_duration INTEGER DEFAULT 300,
    log_channel_id TEXT
  );

  CREATE TABLE IF NOT EXISTS antiwebhook_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    log_channel_id TEXT
  );

  CREATE TABLE IF NOT EXISTS antiwebhook_whitelist (
    guild_id TEXT,
    user_id TEXT,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS antiraid_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    join_threshold INTEGER DEFAULT 10,
    time_window INTEGER DEFAULT 10,
    action TEXT DEFAULT 'kick',
    log_channel_id TEXT
  );
`);

export default db;
