# ctnet
This module contains the framework for a content-driven social network.


# Back (Init Config)

    copies = {
    	".": [
    		"emailTemplates.py",
    		"cron.yaml",
    		"app.yaml"
    	],
    	"img": "*"
    }
    syms = {
    	".": [
    		"PyRSS2Gen.py",
    		"_pa.py",
    		"activate.py",
    		"cronscan.py",
    		"edit.py",
    		"fix_hash.py",
    		"gbot.py",
    		"get.py",
    		"index.py",
    		"invite.py",
    		"login.py",
    		"newUser.py",
    		"phoneAuth.py",
    		"refDoc.py",
    		"remind.py",
    		"router.py",
    		"rss.py",
    		"say.py",
    		"settings.py",
    		"tryAuth.py",
    		"tweet.py",
    		"twilio.py",
    		"upload.py",
    		"util.py",
    		"vote.py"
    	],
    	"html": [
    		"404.html",
    		"about.html",
    		"basic.html",
    		"beta.html",
    		"browsers.html",
    		"cantools.css",
    		"cases.html",
    		"community.html",
    		"home.html",
    		"login.html",
    		"map.html",
    		"newaccount.html",
    		"news.html",
    		"participate.html",
    		"profile.html",
    		"recommendations.html",
    		"referenda.html",
    		"search.html",
    		"security.html",
    		"slider.css",
    		"stream.html",
    		"style2.css",
    		"talk.css",
    		"talk.html",
    		"video.html",
    		"wiki.css",
    		"wiki.html"
    	],
    	"js": ["CAN", "lib", "pages"]
    }
    model = {
    	"ctnet.model": ["*"]
    }
    

# Front (JS Config)

## core.config.ctnet
### Import line: 'CT.require("core.config");'
    {
    	"RECAPTCHA_KEY": null,
    	"name": "Network",
    	"domain": "localhost",
    	"okdomains": ["localhost"],
    	"feedback": "feedback@email.com",
    	"geokeys": [],
    	"pubsub": {
    		"host": null,
    		"port": null,
    		"timezone_offset": 0
    	},
    	"categories": {
    		"icons": {}
    	},
    	"mobile": {
    		"resize": {
    			"stretched": {
    				"alt": "Stretch page to fill your screen",
    				"img": "/img/screen-stretched.png"
    			},
    			"mobile": {
    				"alt": "Zoom into content",
    				"img": "/img/screen-mobile.png"
    			},
    			"normal": {
    				"alt": "Unzoom page",
    				"img": "/img/screen-normal.png"
    			}
    		},
    		"menus": {
    			"alternatives": {
    				"participate": {
    					"page": "participate",
    					"icon": "opinions_and_ideas"
    				},
    				"login": {
    					"page": "login",
    					"icon": "inout"
    				}
    			},
    			"bottom": [
    				{
    					"page": "home",
    					"icon": "world"
    				},
    				{
    					"page": "news",
    					"icon": "articles"
    				},
    				{
    					"page": "video",
    					"icon": "videos"
    				},
    				{
    					"name": "laws",
    					"page": "referenda",
    					"icon": "referenda"
    				},
    				{
    					"name": "people",
    					"page": "community",
    					"icon": "action_groups"
    				},
    				{
    					"name": "hot stuff",
    					"page": "recommendations",
    					"icon": "approver"
    				},
    				{
    					"page": "cases",
    					"icon": "cases"
    				},
    				{
    					"page": "about",
    					"icon": "moderator"
    				}
    			],
    			"top": [
    				{
    					"name": "menu",
    					"firstClass": "bigpadded",
    					"icon": "authenticator"
    				},
    				{
    					"name": "content",
    					"firstClass": "maxwidthoverride",
    					"icon": "position_papers"
    				},
    				{
    					"name": "side bar",
    					"firstClass": "rightcolumn",
    					"icon": "Introduction"
    				}
    			],
    			"home": {
    				"top": [
    					{
    						"name": "challenge",
    						"id": "tripleChallenge",
    						"icon": "founder"
    					},
    					{
    						"name": "change",
    						"id": "howChange",
    						"icon": "world"
    					},
    					{
    						"name": "news",
    						"id": "latestNews",
    						"icon": "articles"
    					},
    					{
    						"name": "video",
    						"id": "latestVideos",
    						"icon": "videos"
    					},
    					{
    						"name": "referenda",
    						"id": "latestRefs",
    						"icon": "referenda"
    					},
    					{
    						"name": "books",
    						"id": "latestBooks",
    						"icon": "books"
    					},
    					{
    						"name": "thoughts",
    						"id": "latestThoughts",
    						"icon": "thought_stream"
    					},
    					{
    						"icon": "approver",
    						"name": "trending",
    						"id": "forum"
    					},
    					{
    						"icon": "conversations",
    						"name": "forum",
    						"id": "topz"
    					}
    				]
    			},
    			"search": {
    				"top": [
    					{
    						"name": "side bar",
    						"firstClass": "rightcolumn",
    						"icon": "Introduction"
    					},
    					{
    						"name": "search results",
    						"id": "searchcontent",
    						"icon": "position_papers"
    					}
    				]
    			},
    			"about": {
    				"menu": "bigtabbed"
    			},
    			"cases": {
    				"menu": "bigtabbed"
    			},
    			"login": {
    				"menu": "bigtabbed"
    			},
    			"participate": {
    				"menu": "bigtabbed"
    			},
    			"profile": {
    				"menu": "leftcolumn"
    			},
    			"community": {
    				"menu": "bigtabbed",
    				"content": "maxwidthoverridestream"
    			},
    			"recommendations": {
    				"menu": "bigtabbed",
    				"content": "maxwidthoverridestream"
    			}
    		}
    	}
    }