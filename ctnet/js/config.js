{
	"RECAPTCHA_KEY": null,
	"name": "Network",
	"domain": "localhost",
	"okdomains": ["localhost"],
	"feedback": "feedback@email.com",
	"geokeys": [],
	"feedlinks": true,
	"pubsub": {
		"host": null,
		"port": null,
		"timezone_offset": 0
	},
	"categories": {
		"icons": {}
	},
	"conversation": {
		"anon_uid": null,
		"comment_prefix": "",
		"allow_anonymous_comments": false
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
			"left": [
				{
					"icon": "stream",
					"page": "community",
					"section": "Stream"
				},
				{
					"icon": "memes",
					"page": "community",
					"section": "Memes"
				},
				{
					"name": "chatter",
					"icon": "comments",
					"page": "community",
					"section": "Chatter"
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
						"name": "thoughts",
						"id": "latestThoughts",
						"icon": "thought_stream"
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
			"news": {
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"className": "hidden",
						"click": "newsclipboard"
					},
					{
						"icon": "invite",
						"className": "hidden",
						"click": "newsinvite"
					}
				]
			},
			"video": {
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"className": "hidden",
						"click": "videoclipboard"
					},
					{
						"icon": "invite",
						"className": "hidden",
						"click": "vidinvite"
					}
				]
			},
			"referenda": {
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"click": "referendaclipboard"
					},
					{
						"icon": "invite",
						"click": "refinvite"
					}
				]
			},
			"cases": {
				"menu": "bigtabbed",
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"className": "hidden",
						"click": "caseclipboard"
					},
					{
						"icon": "invite",
						"click": "caseinvite"
					}
				]
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
				"content": "maxwidthoverridestream",
				"left": [
					{
						"icon": "stream",
						"page": "community",
						"section": "Stream",
						"clickChild": "sbitemStream"
					},
					{
						"icon": "memes",
						"page": "community",
						"section": "Memes",
						"clickChild": "sbitemMemes"
					},
					{
						"name": "chatter",
						"icon": "comments",
						"page": "community",
						"section": "Chatter",
						"clickChild": "sbitemChatter"
					}
				],
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"click": "communityclipboard"
					},
					{
						"icon": "invite",
						"className": "hidden",
						"clickChild": "comminvite"
					}
				]
			},
			"recommendations": {
				"menu": "bigtabbed",
				"content": "maxwidthoverridestream",
				"right": [
					{
						"icon": "clipboard",
						"section": "buttons",
						"click": "recommendationsclipboard"
					}
				]
			}
		}
	}
}