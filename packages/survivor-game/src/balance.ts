// Every number of REQUIREMENTS/survivor-game/balance.md, one named value each (SB-10). Nothing
// else in the code holds a copy. Changing a value means editing this file, then building and
// starting the server again (SB-11). Distances are in world units and speeds in world units per
// second.

// Players (SB-01)
export const PLAYER_RADIUS = 16;
export const PLAYER_SPEED = 160;
export const TEAM_HEALTH = 100;

// Rope (SB-02). The warning share is a fraction of the rope length, so 80 percent is 0.8.
export const ROPE_LENGTH = 400;
export const ROPE_WARNING_SHARE = 0.8;

// Basic shot (SB-03)
export const SHOT_INTERVAL_SECONDS = 1;
export const BULLETS_PER_SHOT = 1;
export const BULLET_DAMAGE = 10;
export const BULLET_HITS = 1;
export const BULLET_RADIUS = 6;
export const BULLET_SPEED = 480;
export const BULLET_RANGE = 480;
export const BULLET_FAN_ANGLE_DEGREES = 10;

// Experience (SB-04)
export const FIRST_LEVEL_EXPERIENCE = 5;
export const EXPERIENCE_ADDED_PER_LEVEL = 3;

// Enemy (SB-05)
export const ENEMY_RADIUS = 14;
export const ENEMY_SPEED = 80;
export const ENEMY_START_HEALTH = 20;
export const ENEMY_HEALTH_GROWTH = 4;
export const ENEMY_HEALTH_GROWTH_INTERVAL_SECONDS = 30;
export const ENEMY_TOUCH_DAMAGE = 5;
export const ENEMY_TOUCH_INTERVAL_SECONDS = 1;
export const ENEMY_EXPERIENCE = 1;
export const ENEMY_START_POINTS = 10;
export const ENEMY_POINTS_GROWTH = 2;
export const ENEMY_POINTS_GROWTH_INTERVAL_SECONDS = 30;

// Enemy numbers (SB-06)
export const ENEMY_SPAWN_RATE_PER_PLAYER_AT_START = 1;
export const ENEMY_SPAWN_RATE_GROWTH = 0.1;
export const ENEMY_SPAWN_RATE_GROWTH_INTERVAL_SECONDS = 30;
export const ENEMY_LIMIT_PER_PLAYER = 50;
export const ENEMY_APPEAR_MIN_DISTANCE = 600;
export const ENEMY_APPEAR_MAX_DISTANCE = 700;
export const ENEMY_REMOVAL_DISTANCE = 1200;

// Upgrades (SB-07). Each upgrade has the effect of one choice and the limit of choices.
export const MORE_BULLETS_PER_CHOICE = 1;
export const MORE_BULLETS_LIMIT = 4;
export const DAMAGE_PER_CHOICE = 5;
export const DAMAGE_LIMIT = 10;
export const PIERCING_PER_CHOICE = 1;
export const PIERCING_LIMIT = 5;
export const BULLET_SIZE_PER_CHOICE = 2;
export const BULLET_SIZE_LIMIT = 5;
export const FIRE_RATE_REDUCTION_PER_CHOICE = 0.1;
export const FIRE_RATE_LIMIT = 8;
export const MOVEMENT_SPEED_PER_CHOICE = 8;
export const MOVEMENT_SPEED_LIMIT = 6;
export const HEALING_PER_CHOICE = 20;

// Running (SB-08)
export const STEP_RATE = 30;
export const EMPTY_RUN_SECONDS = 30;

// View (SB-09)
export const VIEW_SHORT_SIDE = 480;
export const VIEW_LONG_SIDE_MAX = 1040;
