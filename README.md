# statchomper
Takes a GET request of basketball stats and returns a summary

My daughter plays basketball.

I enjoy watching the games, and I like to keep stats.
I keep them in the notes app on my phone, but it is nice to be able to submit them to a service an get a summary.  Less addition for me...

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

```
https://statchomper.herokuapp.com/basketball/ar21-1bs3tffhbsfrrt3f21-1-2-333a
curl https://statchomper.herokuapp.com/basketball/ar21-1bs3tffhbsfrrt3f21-1-2-333a
```

The requests above, produces the following JSON:

```
{
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
```
