import * as SQLite from 'expo-sqlite';

export type VideoItem = {
  id: string;
  name: string;
  description?: string;
  uri: string;
  thumbnailUri?: string;
  createdAt: number;
};

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync('video-diary.db');
    
    // Create videos table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        uri TEXT NOT NULL,
        thumbnailUri TEXT,
        createdAt INTEGER NOT NULL
      );
    `);

    // Add thumbnailUri column if it doesn't exist (migration for existing databases)
    try {
      await db.execAsync(`
        ALTER TABLE videos ADD COLUMN thumbnailUri TEXT;
      `);
      console.log('✅ Added thumbnailUri column to videos table');
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes('duplicate column name')) {
        console.log('⚠️ Migration note:', error.message);
      }
    }

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

export async function getAllVideos(): Promise<VideoItem[]> {
  const database = await initDatabase();
  try {
    const result = await database.getAllAsync<VideoItem>(
      'SELECT * FROM videos ORDER BY createdAt DESC'
    );
    return result;
  } catch (error) {
    console.error('❌ Error fetching videos:', error);
    return [];
  }
}

export async function addVideo(video: VideoItem): Promise<void> {
  const database = await initDatabase();
  try {
    await database.runAsync(
      'INSERT INTO videos (id, name, description, uri, thumbnailUri, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [video.id, video.name, video.description || null, video.uri, video.thumbnailUri || null, video.createdAt]
    );
    console.log('✅ Video added to database:', video.id);
  } catch (error) {
    console.error('❌ Error adding video:', error);
    throw error;
  }
}

export async function removeVideo(id: string): Promise<void> {
  const database = await initDatabase();
  try {
    await database.runAsync('DELETE FROM videos WHERE id = ?', [id]);
    console.log('✅ Video removed from database:', id);
  } catch (error) {
    console.error('❌ Error removing video:', error);
    throw error;
  }
}

export async function getVideoById(id: string): Promise<VideoItem | null> {
  const database = await initDatabase();
  try {
    const result = await database.getFirstAsync<VideoItem>(
      'SELECT * FROM videos WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('❌ Error fetching video:', error);
    return null;
  }
}

export async function updateVideo(id: string, updates: { name?: string; description?: string }): Promise<void> {
  const database = await initDatabase();
  try {
    const updatesList: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updatesList.push('name = ?');
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      updatesList.push('description = ?');
      values.push(updates.description || null);
    }

    if (updatesList.length === 0) {
      console.warn('⚠️ No updates provided');
      return;
    }

    values.push(id);
    const query = `UPDATE videos SET ${updatesList.join(', ')} WHERE id = ?`;
    
    await database.runAsync(query, values);
    console.log('✅ Video updated in database:', id);
  } catch (error) {
    console.error('❌ Error updating video:', error);
    throw error;
  }
}

