# Firehug <small>MozFest port</small>

## Contribute

How to run:

    cp local.json-dist local.json
    npm install
    npm start

Open an issue if you need API keys for `local.json`.

## Deploy to heroku

	heroku create
	git push heroku master
	heroku addons:add redistogo
	heroku config:set NODE_ENV=production
	heroku config:set sessionSecret=secret
	heroku config:set sessionName=sid
	heroku config:set googleKey=yourgooglespreadsheetkey
	heroku config:set threshhold=5000
	heroku open

## License

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
