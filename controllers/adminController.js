/**
 * Admin Controller - Handles document verification and user locking
 */
const Document = require('../models/Document');
const User = require('../models/User');

class AdminController {
  constructor(pool) {
    this.documentModel = new Document(pool);
    this.userModel = new User(pool);
  }

  /**
   * List all pending documents
   */
  async listPending(req, res) {
    try {
      const docs = await this.documentModel.findPending();
      res.status(200).json({ message: 'Pending documents retrieved', documents: docs });
    } catch (error) {
      console.error('List pending error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Error fetching pending documents' });
    }
  }

  /**
   * Verify a document
   */
  async verifyDocument(req, res) {
    try {
      const docId = req.params.id;
      await this.documentModel.updateStatus(docId, 'verified');
      res.status(200).json({ message: 'Document verified successfully' });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Error verifying document' });
    }
  }

  /**
   * Reject a document
   */
  async rejectDocument(req, res) {
    try {
      const docId = req.params.id;
      const { notes } = req.body;
      await this.documentModel.updateStatus(docId, 'rejected', notes);
      res.status(200).json({ message: 'Document rejected successfully' });
    } catch (error) {
      console.error('Reject error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Error rejecting document' });
    }
  }

  /**
   * Lock a user profile
   */
  async lockUser(req, res) {
    try {
      const userId = req.params.id;
      await this.userModel.lock(userId);
      res.status(200).json({ message: 'User locked successfully' });
    } catch (error) {
      console.error('Lock user error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Error locking user' });
    }
  }
}

module.exports = AdminController;
