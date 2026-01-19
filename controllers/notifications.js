import NotificationModel from "../models/Notifications.js";

// Get all notifications for a staff member or admin
export const getNotifications = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { unreadOnly, limit = 50 } = req.query;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const filter = { staffId };
    if (unreadOnly === "true") {
      filter.read = false;
    }

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const unreadCount = await NotificationModel.countDocuments({
      staffId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Get new notifications since a timestamp
export const getNewNotifications = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { since } = req.query;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const filter = { staffId };
    
    if (since) {
      filter.createdAt = { $gt: new Date(parseInt(since)) };
    }

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await NotificationModel.countDocuments({
      staffId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("Error fetching new notifications:", err);
    res.status(500).json({ message: "Failed to fetch new notifications" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    await NotificationModel.updateMany(
      { staffId, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NotificationModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Helper function to create a notification
export const createNotification = async (notificationData) => {
  try {
    const notification = await NotificationModel.create(notificationData);
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};