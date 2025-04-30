const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Route = require('../models/Route');

// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error('Error getting routes:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get favorite routes for a user
router.get('/favorites', auth, async (req, res) => {
  try {
    const favoriteRoutes = await Route.find({ 'favorites.users': req.userData.userId });
    res.json(favoriteRoutes);
  } catch (err) {
    console.error('Error getting favorite routes:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Create a new route
router.post('/', auth, async (req, res) => {
  try {
    const route = new Route({
      user: req.userData.userId,
      ...req.body
    });
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    console.error('Error creating route:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Toggle favorite status for a route
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if user has already favorited this route
    const userFavorited = route.favorites.users?.includes(req.userData.userId);
    
    // Update favorites count and users array
    if (userFavorited) {
      route.favorites.count--;
      route.favorites.users = route.favorites.users.filter(id => id.toString() !== req.userData.userId);
    } else {
      route.favorites.count++;
      if (!route.favorites.users) {
        route.favorites.users = [];
      }
      route.favorites.users.push(req.userData.userId);
    }

    await route.save();
    res.json(route);
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update a route
router.put('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, user: req.userData.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }
    res.json(route);
  } catch (err) {
    console.error('Error updating route:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Delete a route
router.delete('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findOneAndDelete({
      _id: req.params.id,
      user: req.userData.userId
    });
    if (!route) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (err) {
    console.error('Error deleting route:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
