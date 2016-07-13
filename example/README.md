# Example Code

This example assumes you've created a MySQL database on your local computer (`localhost`) called `mysql-chassis` and with a user of `root` and no password.

Run this schema to build the database table `user`

```sql
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL DEFAULT '',
  `last_name` varchar(30) NOT NULL DEFAULT '',
  `datetime_added` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

Then run `npm run example:insert` and `npm run example:select` to see the code run.
