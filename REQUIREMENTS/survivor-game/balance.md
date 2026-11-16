# Survivor Game Balance

These are the numbers the rules in `rules.md` use. Every one is a first guess that has not been played yet (OQ-28). Distances are in world units, and speeds are in world units per second.

## Changing a Value

- SB-10: Every value in this file is kept in one balance file in the game's rules package, with one named value for each. Nothing else in the code holds a copy.
- SB-11: Changing a value means editing that file, then building and starting the server again.

## Players

SB-01:

| Value | Number |
| --- | --- |
| Player radius | 16 |
| Player speed | 160 |
| Team health | 100 |

## Rope

SB-02:

| Value | Number |
| --- | --- |
| Rope length | 400 |
| Rope warning share | 80 percent |

## Basic Shot

SB-03:

| Value | Number |
| --- | --- |
| Time between shots | 1 second |
| Bullets per shot | 1 |
| Damage per bullet | 10 |
| Enemies a bullet can hit | 1 |
| Bullet radius | 6 |
| Bullet speed | 480 |
| Bullet range | 480 |
| Angle between bullets in a fan | 10 degrees |

## Experience

SB-04:

| Value | Number |
| --- | --- |
| Experience for the first level | 5 |
| Added to that for each level after it | 3 |

## Enemy

SB-05:

| Value | Number |
| --- | --- |
| Enemy radius | 14 |
| Enemy speed | 80 |
| Health at the start of the run | 20 |
| Health added to new enemies every 30 seconds | 4 |
| Touch damage | 5 |
| Touch interval | 1 second |
| Experience | 1 |
| Points at the start of the run | 10 |
| Points added to new enemies every 30 seconds | 2 |

## Enemy Numbers

SB-06:

| Value | Number |
| --- | --- |
| Enemies that appear per second for each player, at the start | 1 |
| Added to that rate every 30 seconds | 0.1 |
| Limit of enemies alive at once, for each player | 50 |
| Appear distance range | 600 to 700 |
| Removal distance | 1200 |

## Upgrades

SB-07:

| Upgrade | Applies to | Effect of each choice | Limit of choices | Value at the limit |
| --- | --- | --- | --- | --- |
| More bullets | Individual | 1 more bullet per shot | 4 | 5 bullets |
| Damage | Individual | 5 more damage per bullet | 10 | 60 damage |
| Piercing | Individual | A bullet can hit 1 more enemy | 5 | 6 enemies |
| Bullet size | Individual | Bullet radius grows by 2 | 5 | Radius 16 |
| Fire rate | Individual | 10 percent less time between shots | 8 | About 0.43 seconds |
| Movement speed | Team | Player speed grows by 8 | 6 | Speed 208 |
| Healing | Team | Team health is restored by 20, up to full health | None | Not applicable |

At these limits one player has at most about 12 bullets in flight, and a team of 4 has about 48 bullets and at most 200 enemies.

## Running

SB-08:

| Value | Number |
| --- | --- |
| Step rate | 30 steps per second |
| Empty run time | 30 seconds |

## View

SB-09:

| Value | Number |
| --- | --- |
| Arena shown along the short side of the screen | 480 |
| Most arena shown along the long side of the screen | 1040 |

A screen that is longer than this shows bars at both ends instead of more arena. The farthest corner of the view is then about 573 from the player, which is inside the appear distance.
