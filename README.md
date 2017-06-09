# statchomper
Takes a GET request of basketball stats and returns a summary

My daughter plays basketball.

I enjoy watching the games, and I like to keep stats.
Very simply, I keep them in the notes app on my iphone.

A typical statline might look like this:
ar21-1bs3tffhbsfrrt3f21-1-2-333a

```
a = assist
r = rebound
t = turnover
s = steal
b = block
f = foul
1 = freethrow
2 = 2 point shot
3 = 3 point shot
-1 = missed freethrow
-2 = missed 2 point shot
-3 = missed 3 point shot
h = halftime (Required, even if there are no stats in first or second half)
```

The above statline, produces the following JSON:

```
{
	"firstHalf": {
		"assists": 1,
		"rebounds": 1,
		"turnovers": 1,
		"blocks": 1,
		"steals": 1,
		"fouls": 2,
		"threePointAttempts": 1,
		"threePointMade": 1,
		"threePointPercentage": 100,
		"twoPointAttempts": 1,
		"twoPointMade": 1,
		"twoPointPercentage": 100,
		"freeThrowAttempts": 2,
		"freeThrowMade": 1,
		"freeThrowPercentage": 50,
		"points": 6
	},
	"secondHalf": {
		"assists": 1,
		"rebounds": 2,
		"turnovers": 1,
		"blocks": 1,
		"steals": 1,
		"fouls": 2,
		"threePointAttempts": 4,
		"threePointMade": 3,
		"threePointPercentage": 75,
		"twoPointAttempts": 2,
		"twoPointMade": 1,
		"twoPointPercentage": 50,
		"freeThrowAttempts": 2,
		"freeThrowMade": 1,
		"freeThrowPercentage": 50,
		"points": 12
	},
	"game": {
		"assists": 2,
		"rebounds": 3,
		"turnovers": 2,
		"blocks": 2,
		"steals": 2,
		"fouls": 4,
		"threePointAttempts": 5,
		"threePointMade": 4,
		"threePointPercentage": 80,
		"twoPointAttempts": 3,
		"twoPointMade": 2,
		"twoPointPercentage": 67,
		"freeThrowAttempts": 4,
		"freeThrowMade": 2,
		"freeThrowPercentage": 50,
		"points": 18
	}
}
```
