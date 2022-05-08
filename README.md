

# Thebetabase

### front end project root

    /packages/fe/

### to run the app (run both front and back end)

  npx nx serve be
  npx nx serve fe

### if you get 'Error: DB_HOST is not defined'

    you will need to put a .env file in project root (ask a project member for this)

### if, after doing the above, you get the following console error on the login page

    Failed to load resource: the server responded with a status of 404 (Not Found) :3000/api/auth/sign-in:1

then .... TBD

## Deployment

go to

    https://dashboard.heroku.com/apps/betabase/deploy/heroku-git

pull changes from github and then push them to the git from heroku. this should trigger deploy. you should be able to check in the logs:

    heroku logs --tail --app betabase


