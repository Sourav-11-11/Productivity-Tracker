const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Note = require('../models/Note');

const SYSTEM_USER = 'default_user'; // For now, use a default user

// ============ SYNC ENDPOINT ============
// POST /api/notes/sync
// Accepts full local data (folders + notes) and syncs to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { folders = [], notes = [] } = req.body;
    const userId = SYSTEM_USER;

    // Upsert folders - use custom id from client
    for (const folder of folders) {
      await Folder.findByIdAndUpdate(
        folder.id,
        { _id: folder.id, ...folder, userId, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Upsert notes - use custom id from client
    for (const note of notes) {
      await Note.findByIdAndUpdate(
        note.id,
        { _id: note.id, ...note, userId, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Return latest cloud data
    const cloudFolders = await Folder.find({ userId });
    const cloudNotes = await Note.find({ userId });

    res.status(200).json({
      success: true,
      data: {
        folders: cloudFolders.map(f => ({ ...f.toObject(), id: f._id })),
        notes: cloudNotes.map(n => ({ ...n.toObject(), id: n._id })),
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GET ALL NOTES & FOLDERS ============
// GET /api/notes/all
router.get('/all', async (req, res) => {
  try {
    const userId = SYSTEM_USER;

    const folders = await Folder.find({ userId });
    const notes = await Note.find({ userId });

    res.status(200).json({
      success: true,
      data: {
        folders: folders.map(f => ({ ...f.toObject(), id: f._id })),
        notes: notes.map(n => ({ ...n.toObject(), id: n._id })),
      },
    });
  } catch (error) {
    console.error('Get all error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ FOLDER ENDPOINTS ============

// POST /api/notes/folders
// Create a new folder
router.post('/folders', async (req, res) => {
  try {
    const { name, id } = req.body;
    const userId = SYSTEM_USER;
    const folderId = id || `folder_${Date.now()}`;

    const folder = new Folder({
      _id: folderId,
      userId,
      name,
    });

    await folder.save();

    res.status(201).json({
      success: true,
      data: { ...folder.toObject(), id: folder._id },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notes/folders/:id
// Delete a folder and all its notes
router.delete('/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = SYSTEM_USER;

    // Delete all notes in this folder
    await Note.deleteMany({ folderId: id, userId });

    // Delete the folder
    await Folder.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Folder and its notes deleted',
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ NOTE ENDPOINTS ============

// POST /api/notes
// Create a new note
router.post('/notes', async (req, res) => {
  try {
    const { folderId, title, content = '', id } = req.body;
    const userId = SYSTEM_USER;
    const noteId = id || `note_${Date.now()}`;

    const note = new Note({
      _id: noteId,
      userId,
      folderId,
      title,
      content,
    });

    await note.save();

    res.status(201).json({
      success: true,
      data: { ...note.toObject(), id: note._id },
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notes/:id
// Update a note
router.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findByIdAndUpdate(
      id,
      { title, content, updatedAt: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: { ...note.toObject(), id: note._id },
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notes/:id
// Delete a note
router.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await Note.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Note deleted',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
