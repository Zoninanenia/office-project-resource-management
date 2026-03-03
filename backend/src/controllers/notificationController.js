const pool = require('../config/db');

// ดึงการแจ้งเตือนทั้งหมดของ User นั้นๆ
exports.getNotifications = async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            `SELECT notificationId as "notificationId", taskId as "taskId", type, message, isRead as "isRead", createdAt as "createdAt"
             FROM Notifications
             WHERE userId = $1
             ORDER BY createdAt DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Notifications Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// อัปเดตสถานะว่าอ่านแล้ว 1 รายการ
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        await pool.query(
            'UPDATE Notifications SET isRead = true WHERE notificationId = $1 AND userId = $2',
            [id, userId]
        );
        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Mark Read Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// อัปเดตสถานะว่าอ่านแล้วทั้งหมด
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.userId;
    try {
        await pool.query(
            'UPDATE Notifications SET isRead = true WHERE userId = $1',
            [userId]
        );
        res.json({ message: 'All marked as read' });
    } catch (err) {
        console.error('Mark All Read Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};