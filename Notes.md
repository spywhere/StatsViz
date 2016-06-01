### Javatar Stats

Option to include debug mode

- Installs per day (Line) - Num rows group by version and date limit 30 days  
```
SELECT SEND_DATE, COUNT(SEND_DATE) FROM `JUsage10` WHERE `ACTION`='install' AND `SEND_DATE` > DATE_SUB(NOW(), INTERVAL 1 MONTH)  GROUP BY `SEND_DATE`
```
- Upgrades per day (Line) - Num rows group by version and date limit 30 days
```
SELECT SEND_DATE, J_VERSION, COUNT(UID) FROM `JUsage10` WHERE `SEND_DATE` > DATE_SUB(NOW(), INTERVAL 1 MONTH) GROUP BY `SEND_DATE`, `J_VERSION`
```
- Startup time with average startup time (Line) - Startup time group by date limit 30 days  
```
SELECT `SEND_DATE`, AVG(CAST(`J_STARTUP_TIME` AS SIGNED)) FROM `JUsage10` WHERE `SEND_DATE` > DATE_SUB(NOW(), INTERVAL 1 MONTH) GROUP BY `SEND_DATE`
```
- Javatar Version (Pie) - Version group by version  
```
SELECT `J_VERSION`, COUNT(`J_VERSION`) FROM `JUsage10` GROUP BY `J_VERSION`
```
- Platforms (Pie) - Platform group by platform  
```
SELECT `PLATFORM`, COUNT(`PLATFORM`) FROM `JUsage10` GROUP BY `PLATFORM`
```

### Packages Stats

- Packages (Pie)
- Installs/Uninstalls per day (Line) - Num action group by date limit 30 days
- Platforms (Pie) - Platform group by platform
- Package per platform (Pie)
- Installs per platform (Pie) - Num rows group by platform

### Interesting Data

- Average internet speed
