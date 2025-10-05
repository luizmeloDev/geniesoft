const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../config/logger');
const { adminAuth } = require('./adminAuth');
const { getSetting } = require('../config/settingsManager');
const CableNetworkUtils = require('../utils/cableNetworkUtils');

const getAppSettings = (req, res, next) => {
    req.appSettings = {
        companyHeader: getSetting('company_header', 'ISP Monitor'),
    };
    next();
};

const dbPath = path.join(__dirname, '../data/billing.db');

function getDatabase() {
    return new sqlite3.Database(dbPath);
}

router.get('/', adminAuth, getAppSettings, async (req, res) => {
    try {
        const db = getDatabase();
        
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM odps) as total_odps,
                    (SELECT COUNT(*) FROM odps WHERE status = 'active') as active_odps,
                    (SELECT COUNT(*) FROM odps WHERE status = 'maintenance') as maintenance_odps,
                    (SELECT COUNT(*) FROM cable_routes) as total_cables,
                    (SELECT COUNT(*) FROM cable_routes WHERE status = 'connected') as connected_cables,
                    (SELECT COUNT(*) FROM customers WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as mapped_customers
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });

        const recentODPs = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM odps ORDER BY created_at DESC LIMIT 5`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const recentCables = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cr.*, c.name as customer_name, c.phone as customer_phone
                FROM cable_routes cr
                LEFT JOIN customers c ON cr.customer_id = c.id
                ORDER BY cr.created_at DESC 
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        db.close();

        res.render('admin/cable-network/dashboard', {
            title: 'Cable Network Dashboard',
            stats,
            recentODPs,
            recentCables,
            appSettings: req.appSettings
        });

    } catch (error) {
        logger.error('Error loading cable network dashboard:', error);
        res.status(500).render('error', { 
            error: 'Failed to load cable network dashboard',
            appSettings: req.appSettings 
        });
    }
});

router.get('/odp', adminAuth, getAppSettings, async (req, res) => {
    try {
        const db = getDatabase();
        
        const odps = await new Promise((resolve, reject) => {
            db.all(`
                SELECT o.*, 
                       p.name as parent_name,
                       p.code as parent_code,
                       COUNT(CASE WHEN cr.customer_id IS NOT NULL THEN cr.id END) as connected_customers,
                       COUNT(CASE WHEN cr.status = 'connected' AND cr.customer_id IS NOT NULL THEN 1 END) as active_connections
                FROM odps o
                LEFT JOIN odps p ON o.parent_odp_id = p.id
                LEFT JOIN cable_routes cr ON o.id = cr.odp_id
                GROUP BY o.id
                ORDER BY o.name
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const parentOdps = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, code, capacity, used_ports, status
                FROM odps 
                WHERE parent_odp_id IS NULL AND status = 'active'
                ORDER BY name
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        db.close();
        
        res.render('admin/cable-network/odp', {
            title: 'ODP Management',
            appSettings: req.appSettings,
            odps: odps,
            parentOdps: parentOdps
        });
    } catch (error) {
        logger.error('Error loading ODP page:', error);
        res.status(500).render('error', {
            message: 'Error loading ODP page',
            error: error.message,
            appSettings: req.appSettings
        });
    }
});

router.get('/cables', adminAuth, getAppSettings, async (req, res) => {
    try {
        const db = getDatabase();
        
        const cableRoutes = await new Promise((resolve, reject) => {
            db.all(`
                SELECT cr.*, 
                       c.name as customer_name, c.phone as customer_phone,
                       c.latitude as customer_latitude, c.longitude as customer_longitude,
                       o.name as odp_name, o.code as odp_code,
                       o.latitude as odp_latitude, o.longitude as odp_longitude
                FROM cable_routes cr
                JOIN customers c ON cr.customer_id = c.id
                JOIN odps o ON cr.odp_id = o.id
                ORDER BY cr.created_at DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const odps = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM odps WHERE status = "active" ORDER BY name', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const customersWithoutCable = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.* FROM customers c
                LEFT JOIN cable_routes cr ON c.id = cr.customer_id
                WHERE cr.id IS NULL AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
                ORDER BY c.name
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        db.close();
        
        res.render('admin/cable-network/cables', {
            title: 'Cable Route Management',
            appSettings: req.appSettings,
            cableRoutes: cableRoutes,
            odps: odps,
            customersWithoutCable: customersWithoutCable
        });
    } catch (error) {
        logger.error('Error loading cable routes page:', error);
        res.status(500).render('error', {
            message: 'Error loading cable routes page',
            error: error.message,
            appSettings: req.appSettings
        });
    }
});

router.get('/analytics', adminAuth, getAppSettings, async (req, res) => {
    try {
        res.render('admin/cable-network/analytics', {
            title: 'Cable Network Analytics',
            appSettings: req.appSettings
        });
    } catch (error) {
        logger.error('Error loading analytics page:', error);
        res.status(500).render('error', {
            message: 'Error loading analytics page',
            error: error.message,
            appSettings: req.appSettings
        });
    }
});

module.exports = router;