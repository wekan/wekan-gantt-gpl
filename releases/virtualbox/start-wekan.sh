# If you want to restart even on crash, uncomment while and done lines.

#while true; do
      cd ~/repos/wekan/.build/bundle
      #---------------------------------------------
      # Debug OIDC OAuth2 etc.
      #export DEBUG=true
      #---------------------------------------------
      export MONGO_URL='mongodb://127.0.0.1:27017/wekan'
      #---------------------------------------------
      # Production: https://example.com/wekan
      # Local: http://localhost:2000
      #export ipaddress=$(ifdata -pa eth0)
      export ROOT_URL='http://localhost:2000'
      #---------------------------------------------
      # https://github.com/wekan/wekan/wiki/Troubleshooting-Mail
      # https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml
      export MAIL_URL='smtp://user:pass@mailserver.example.com:25/'
      export MAIL_FROM='Wekan Boards <info@example.com>'
      #export MAIL_SERVICE=Outlook365
      #export MAIL_SERVICE_USER=firstname.lastname@hotmail.com
      #export MAIL_SERVICE_PASSWORD=SecretPassword
      #---------------------------------------------
      #export KADIRA_OPTIONS_ENDPOINT=http://127.0.0.1:11011
      #---------------------------------------------
      # This is local port where Wekan Node.js runs, same as below on Caddyfile settings.
      export PORT=2000
      #---------------------------------------------
      # ==== NUMBER OF SEARCH RESULTS PER PAGE BY DEFAULT ====
      #export RESULTS_PER_PAGE=20
      #---------------------------------------------
      # Wekan Export Board works when WITH_API=true.
      # If you disable Wekan API with false, Export Board does not work.
      export WITH_API='true'
      #---------------------------------------------------------------
      # ==== PASSWORD BRUTE FORCE PROTECTION ====
      #https://atmospherejs.com/lucasantoniassi/accounts-lockout
      #Defaults below. Uncomment to change. wekan/server/accounts-lockout.js
      #export ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE=3
      #export ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD=60
      #export ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW=15
      #export ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE=3
      #export ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD=60
      #export ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW=15
      #---------------------------------------------------------------
      # ==== ACCOUNT OPTIONS ====
      # https://docs.meteor.com/api/accounts-multi.html#AccountsCommon-config
      # Defaults below. Uncomment to change. wekan/server/accounts-common.js
      # - ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS=90
      #---------------------------------------------------------------
      # ==== Allow configuration to validate uploaded attachments ====
      #export ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM="/usr/local/bin/avscan {file}"
      #export ATTACHMENTS_UPLOAD_MIME_TYPES="image/*,text/*"
      #export ATTACHMENTS_UPLOAD_MAX_SIZE=5000000
      #---------------------------------------------------------------
      # ==== Allow configuration to validate uploaded avatars ====
      #export AVATARS_UPLOAD_EXTERNAL_PROGRAM="/usr/local/bin/avscan {file}"
      #export AVATARS_UPLOAD_MIME_TYPES="image/*"
      #export AVATARS_UPLOAD_MAX_SIZE=500000
      #---------------------------------------------------------------
      # ==== RICH TEXT EDITOR IN CARD COMMENTS ====
      # https://github.com/wekan/wekan/pull/2560
      export RICHER_CARD_COMMENT_EDITOR=false
      #---------------------------------------------------------------
      # ==== CARD OPENED, SEND WEBHOOK MESSAGE ====
      export CARD_OPENED_WEBHOOK_ENABLED=false
      #---------------------------------------------------------------
      # ==== Allow to shrink attached/pasted image ====
      # https://github.com/wekan/wekan/pull/2544
      #export MAX_IMAGE_PIXEL=1024
      #export IMAGE_COMPRESS_RATIO=80
      #---------------------------------------------------------------
      # ==== NOTIFICATION TRAY AFTER READ DAYS BEFORE REMOVE =====
      # Number of days after a notification is read before we remove it.
      # Default: 2
      #- NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE=2
      #---------------------------------------------------------------
      # ==== BIGEVENTS DUE ETC NOTIFICATIONS =====
      # https://github.com/wekan/wekan/pull/2541
      # Introduced a system env var BIGEVENTS_PATTERN default as "NONE",
      # so any activityType matches the pattern, system will send out
      # notifications to all board members no matter they are watching
      # or tracking the board or not. Owner of the wekan server can
      # disable the feature by setting this variable to "NONE" or
      # change the pattern to any valid regex. i.e. '|' delimited
      # activityType names.
      # a) Example
      #export BIGEVENTS_PATTERN=due
      # b) All
      #export BIGEVENTS_PATTERN=received|start|due|end
      # c) Disabled
      export BIGEVENTS_PATTERN=NONE
      #---------------------------------------------------------------
      # ==== EMAIL DUE DATE NOTIFICATION =====
      # https://github.com/wekan/wekan/pull/2536
      # System timelines will be showing any user modification for
      # dueat startat endat receivedat, also notification to
      # the watchers and if any card is due, about due or past due.
      #
      # Notify due days, default is None.
      #export NOTIFY_DUE_DAYS_BEFORE_AND_AFTER=2,0
      # it will notify user 2 days before due day and on the due day
      #
      # Notify due at hour of day. Default every morning at 8am. Can be 0-23.
      # If env variable has parsing error, use default. Notification sent to watchers.
      #export NOTIFY_DUE_AT_HOUR_OF_DAY=8
      #-----------------------------------------------------------------
      # ==== EMAIL NOTIFICATION TIMEOUT, ms =====
      # Defaut: 30000 ms = 30s
      #export EMAIL_NOTIFICATION_TIMEOUT=30000
      #-----------------------------------------------------------------
      # CORS: Set Access-Control-Allow-Origin header. Example: *
      #export CORS=*
      # To enable the Set Access-Control-Allow-Headers header. "Authorization,Content-Type" is required for cross-origin use of the API.
      #export CORS_ALLOW_HEADERS=Authorization,Content-Type
      # To enable the Set Access-Control-Expose-Headers header.  This is not needed for typical CORS situations. Example: *
      #export CORS_EXPOSE_HEADERS=*
      #---------------------------------------------
      ## Optional: Integration with Matomo https://matomo.org that is installed to your server
      ## The address of the server where Matomo is hosted:
      ##export MATOMO_ADDRESS=https://example.com/matomo
      #export MATOMO_ADDRESS=
      ## The value of the site ID given in Matomo server for Wekan
      # Example: export MATOMO_SITE_ID=123456789
      #export MATOMO_SITE_ID=''
      ## The option do not track which enables users to not be tracked by matomo"
      #Example: export MATOMO_DO_NOT_TRACK=false
      #export MATOMO_DO_NOT_TRACK=true
      ## The option that allows matomo to retrieve the username:
      # Example: export MATOMO_WITH_USERNAME=true
      #export MATOMO_WITH_USERNAME='false'
      # Enable browser policy and allow one trusted URL that can have iframe that has Wekan embedded inside.
      # Setting this to false is not recommended, it also disables all other browser policy protections
      # and allows all iframing etc. See wekan/server/policy.js
      # Default value: true
      export BROWSER_POLICY_ENABLED=true
      # When browser policy is enabled, HTML code at this Trusted URL can have iframe that embeds Wekan inside.
      # Example: export TRUSTED_URL=http://example.com
      export TRUSTED_URL=''
      # What to send to Outgoing Webhook, or leave out. Example, that includes all that are default: cardId,listId,oldListId,boardId,comment,user,card,commentId .
      # Example: export WEBHOOKS_ATTRIBUTES=cardId,listId,oldListId,boardId,comment,user,card,commentId
      export WEBHOOKS_ATTRIBUTES=''
      #---------------------------------------------
      # ==== OAUTH2 AZURE ====
      # https://github.com/wekan/wekan/wiki/Azure
      # 1) Register the application with Azure. Make sure you capture
      #    the application ID as well as generate a secret key.
      # 2) Configure the environment variables. This differs slightly
      #     by installation type, but make sure you have the following:
      #export OAUTH2_ENABLED=true
      # Use OAuth2 ADFS additional changes. Also needs OAUTH2_ENABLED=true setting.
      #export OAUTH2_ADFS_ENABLED=false
      # OAuth2 docs: https://github.com/wekan/wekan/wiki/OAuth2
      # OAuth2 login style: popup or redirect.
      #export OAUTH2_LOGIN_STYLE=redirect
      # Application GUID captured during app registration:
      #export OAUTH2_CLIENT_ID=xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx
      # Secret key generated during app registration:
      #export OAUTH2_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      #export OAUTH2_SERVER_URL=https://login.microsoftonline.com/
      #export OAUTH2_AUTH_ENDPOINT=/oauth2/v2.0/authorize
      #export OAUTH2_USERINFO_ENDPOINT=https://graph.microsoft.com/oidc/userinfo
      #export OAUTH2_TOKEN_ENDPOINT=/oauth2/v2.0/token
      # The claim name you want to map to the unique ID field:
      #export OAUTH2_ID_MAP=email
      # The claim name you want to map to the username field:
      #export OAUTH2_USERNAME_MAP=email
      # The claim name you want to map to the full name field:
      #export OAUTH2_FULLNAME_MAP=name
      # The claim name you want to map to the email field:
      #export OAUTH2_EMAIL_MAP=email
      #-----------------------------------------------------------------
      # ==== OAUTH2 KEYCLOAK ====
      # https://github.com/wekan/wekan/wiki/Keycloak  <== MAPPING INFO, REQUIRED
      #export OAUTH2_ENABLED=true
      # OAuth2 login style: popup or redirect.
      #export OAUTH2_LOGIN_STYLE=redirect
      #export OAUTH2_CLIENT_ID=<Keycloak create Client ID>
      #export OAUTH2_SERVER_URL=<Keycloak server name>/auth
      #export OAUTH2_AUTH_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/auth
      #export OAUTH2_USERINFO_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/userinfo
      #export OAUTH2_TOKEN_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/token
      #export OAUTH2_SECRET=<keycloak client secret>
      #-----------------------------------------------------------------
      # ==== OAUTH2 DOORKEEPER ====
      # OAuth2 docs: https://github.com/wekan/wekan/wiki/OAuth2
      # https://github.com/wekan/wekan/issues/1874
      # https://github.com/wekan/wekan/wiki/OAuth2
      # Enable the OAuth2 connection
      #export OAUTH2_ENABLED=true
      # OAuth2 login style: popup or redirect.
      #export OAUTH2_LOGIN_STYLE=redirect
      # OAuth2 Client ID.
      #export OAUTH2_CLIENT_ID=abcde12345
      # OAuth2 Secret.
      #export OAUTH2_SECRET=54321abcde
      # OAuth2 Server URL.
      #export OAUTH2_SERVER_URL=https://chat.example.com
      # OAuth2 Authorization Endpoint.
      #export OAUTH2_AUTH_ENDPOINT=/oauth/authorize
      # OAuth2 Userinfo Endpoint.
      #export OAUTH2_USERINFO_ENDPOINT=/oauth/userinfo
      # OAuth2 Token Endpoint.
      #export OAUTH2_TOKEN_ENDPOINT=/oauth/token
      # OAUTH2 ID Token Whitelist Fields.
      #export OAUTH2_ID_TOKEN_WHITELIST_FIELDS=[]
      # OAUTH2 Request Permissions.
      #export OAUTH2_REQUEST_PERMISSIONS=openid profile email
      # OAuth2 ID Mapping
      #export OAUTH2_ID_MAP=
      # OAuth2 Username Mapping
      #export OAUTH2_USERNAME_MAP=
      # OAuth2 Fullname Mapping
      #export OAUTH2_FULLNAME_MAP=
      # OAuth2 Email Mapping
      #export OAUTH2_EMAIL_MAP=
      #---------------------------------------------
      # LDAP_ENABLE : Enable or not the connection by the LDAP
      # example :  export LDAP_ENABLE=true
      #export LDAP_ENABLE=false
      # LDAP_PORT : The port of the LDAP server
      # example :  export LDAP_PORT=389
      #export LDAP_PORT=389
      # LDAP_HOST : The host server for the LDAP server
      # example :  export LDAP_HOST=localhost
      #export LDAP_HOST=
      # LDAP_BASEDN : The base DN for the LDAP Tree
      # example :  export LDAP_BASEDN=ou=user,dc=example,dc=org
      #export LDAP_BASEDN=
      # LDAP_LOGIN_FALLBACK : Fallback on the default authentication method
      # example :  export LDAP_LOGIN_FALLBACK=true
      #export LDAP_LOGIN_FALLBACK=false
      # LDAP_RECONNECT : Reconnect to the server if the connection is lost
      # example :  export LDAP_RECONNECT=false
      #export LDAP_RECONNECT=true
      # LDAP_TIMEOUT : Overall timeout, in milliseconds
      # example :  export LDAP_TIMEOUT=12345
      #export LDAP_TIMEOUT=10000
      # LDAP_IDLE_TIMEOUT : Specifies the timeout for idle LDAP connections in milliseconds
      # example :  export LDAP_IDLE_TIMEOUT=12345
      #export LDAP_IDLE_TIMEOUT=10000
      # LDAP_CONNECT_TIMEOUT : Connection timeout, in milliseconds
      # example :  export LDAP_CONNECT_TIMEOUT=12345
      #export LDAP_CONNECT_TIMEOUT=10000
      # LDAP_AUTHENTIFICATION : If the LDAP needs a user account to search
      # example :  export LDAP_AUTHENTIFICATION=true
      #export LDAP_AUTHENTIFICATION=false
      # LDAP_AUTHENTIFICATION_USERDN : The search user DN
      # example :  export LDAP_AUTHENTIFICATION_USERDN=cn=admin,dc=example,dc=org
      #----------------------------------------------------------------------------
      # The search user DN - You need quotes when you have spaces in parameters
      # 2 examples:
      #export LDAP_AUTHENTIFICATION_USERDN="CN=ldap admin,CN=users,DC=domainmatter,DC=lan"
      #export LDAP_AUTHENTIFICATION_USERDN="CN=wekan_adm,OU=serviceaccounts,OU=admin,OU=prod,DC=mydomain,DC=com"
      #---------------------------------------------------------------------------
      # LDAP_AUTHENTIFICATION_PASSWORD : The password for the search user
      # example : AUTHENTIFICATION_PASSWORD=admin
      #export LDAP_AUTHENTIFICATION_PASSWORD=
      # LDAP_LOG_ENABLED : Enable logs for the module
      # example :  export LDAP_LOG_ENABLED=true
      #export LDAP_LOG_ENABLED=false
      # LDAP_BACKGROUND_SYNC : If the sync of the users should be done in the background
      # example :  export LDAP_BACKGROUND_SYNC=true
      #export LDAP_BACKGROUND_SYNC=false
      # LDAP_BACKGROUND_SYNC_INTERVAL : At which interval does the background task sync in milliseconds
      # At which interval does the background task sync in milliseconds.
      # Leave this unset, so it uses default, and does not crash.
      # https://github.com/wekan/wekan/issues/2354#issuecomment-515305722
      export LDAP_BACKGROUND_SYNC_INTERVAL=''
      # LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED :
      # example :  export LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=true
      #export LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED=false
      # LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS :
      # example :  export LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=true
      #export LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS=false
      # LDAP_ENCRYPTION : If using LDAPS
      # example :  export LDAP_ENCRYPTION=ssl
      #export LDAP_ENCRYPTION=false
      # LDAP_CA_CERT : The certification for the LDAPS server. Certificate needs to be included in this docker-compose.yml file.
      # example :  export LDAP_CA_CERT=-----BEGIN CERTIFICATE-----MIIE+zCCA+OgAwIBAgIkAhwR/6TVLmdRY6hHxvUFWc0+Enmu/Hu6cj+G2FIdAgIC...-----END CERTIFICATE-----
      #export LDAP_CA_CERT=
      # LDAP_REJECT_UNAUTHORIZED : Reject Unauthorized Certificate
      # example :  export LDAP_REJECT_UNAUTHORIZED=true
      #export LDAP_REJECT_UNAUTHORIZED=false
      # Option to login to the LDAP server with the user's own username and password, instead of an administrator key. Default: false (use administrator key).
      #export LDAP_USER_AUTHENTICATION=true
      # Which field is used to find the user for the user authentication. Default: uid.
      #export LDAP_USER_AUTHENTICATION_FIELD=uid
      # LDAP_USER_SEARCH_FILTER : Optional extra LDAP filters. Don't forget the outmost enclosing parentheses if needed
      # example :  export LDAP_USER_SEARCH_FILTER=
      #export LDAP_USER_SEARCH_FILTER=
      # LDAP_USER_SEARCH_SCOPE : base (search only in the provided DN), one (search only in the provided DN and one level deep), or sub (search the whole subtree)
      # example :  export LDAP_USER_SEARCH_SCOPE=one
      #export LDAP_USER_SEARCH_SCOPE=
      # LDAP_USER_SEARCH_FIELD : Which field is used to find the user
      # example :  export LDAP_USER_SEARCH_FIELD=uid
      #export LDAP_USER_SEARCH_FIELD=
      # LDAP_SEARCH_PAGE_SIZE : Used for pagination (0=unlimited)
      # example :  export LDAP_SEARCH_PAGE_SIZE=12345
      #export LDAP_SEARCH_PAGE_SIZE=0
      # LDAP_SEARCH_SIZE_LIMIT : The limit number of entries (0=unlimited)
      # example :  export LDAP_SEARCH_SIZE_LIMIT=12345
      #export LDAP_SEARCH_SIZE_LIMIT=0
      # LDAP_GROUP_FILTER_ENABLE : Enable group filtering
      # example :  export LDAP_GROUP_FILTER_ENABLE=true
      #export LDAP_GROUP_FILTER_ENABLE=false
      # LDAP_GROUP_FILTER_OBJECTCLASS : The object class for filtering
      # example :  export LDAP_GROUP_FILTER_OBJECTCLASS=group
      #export LDAP_GROUP_FILTER_OBJECTCLASS=
      # LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE=
      # LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT=
      # LDAP_GROUP_FILTER_GROUP_NAME :
      # example :
      #export LDAP_GROUP_FILTER_GROUP_NAME=
      # LDAP_UNIQUE_IDENTIFIER_FIELD : This field is sometimes class GUID (Globally Unique Identifier)
      # example :  export LDAP_UNIQUE_IDENTIFIER_FIELD=guid
      #export LDAP_UNIQUE_IDENTIFIER_FIELD=
      # LDAP_UTF8_NAMES_SLUGIFY : Convert the username to utf8
      # example :  export LDAP_UTF8_NAMES_SLUGIFY=false
      #export LDAP_UTF8_NAMES_SLUGIFY=true
      # LDAP_USERNAME_FIELD : Which field contains the ldap username
      # example :  export LDAP_USERNAME_FIELD=username
      #export LDAP_USERNAME_FIELD=
      # LDAP_FULLNAME_FIELD : Which field contains the ldap fullname
      # example :  export LDAP_FULLNAME_FIELD=fullname
      #export LDAP_FULLNAME_FIELD=
      # LDAP_MERGE_EXISTING_USERS :
      # example :  export LDAP_MERGE_EXISTING_USERS=true
      #export LDAP_MERGE_EXISTING_USERS=false
      # LDAP_EMAIL_MATCH_ENABLE : allow existing account matching by e-mail address when username does not match
      # example: LDAP_EMAIL_MATCH_ENABLE=true
      #export LDAP_EMAIL_MATCH_ENABLE=false
      # LDAP_EMAIL_MATCH_REQUIRE : require existing account matching by e-mail address when username does match
      # example: LDAP_EMAIL_MATCH_REQUIRE=true
      #export LDAP_EMAIL_MATCH_REQUIRE=false
      # LDAP_EMAIL_MATCH_VERIFIED : require existing account email address to be verified for matching
      # example: LDAP_EMAIL_MATCH_VERIFIED=true
      #export LDAP_EMAIL_MATCH_VERIFIED=false
      # LDAP_EMAIL_FIELD : which field contains the LDAP e-mail address
      # example: LDAP_EMAIL_FIELD=mail
      #export LDAP_EMAIL_FIELD=
      # LDAP_SYNC_USER_DATA :
      # example :  export LDAP_SYNC_USER_DATA=true
      #export LDAP_SYNC_USER_DATA=false
      # LDAP_SYNC_USER_DATA_FIELDMAP :
      # example :  export LDAP_SYNC_USER_DATA_FIELDMAP={"cn":"name", "mail":"email"}
      #export LDAP_SYNC_USER_DATA_FIELDMAP=
      # LDAP_SYNC_GROUP_ROLES :
      # example :
      #export LDAP_SYNC_GROUP_ROLES=
      # LDAP_DEFAULT_DOMAIN : The default domain of the ldap it is used to create email if the field is not map correctly with the LDAP_SYNC_USER_DATA_FIELDMAP
      # example :
      #export LDAP_DEFAULT_DOMAIN=
      # Enable/Disable syncing of admin status based on ldap groups:
      #export LDAP_SYNC_ADMIN_STATUS=true
      # Comma separated list of admin group names to sync.
      #export LDAP_SYNC_ADMIN_GROUPS=group1,group2
      #---------------------------------------------------------------------
      # Login to LDAP automatically with HTTP header.
      # In below example for siteminder, at right side of = is header name.
      #export HEADER_LOGIN_ID=HEADERUID
      #export HEADER_LOGIN_FIRSTNAME=HEADERFIRSTNAME
      #export HEADER_LOGIN_LASTNAME=HEADERLASTNAME
      #export HEADER_LOGIN_EMAIL=HEADEREMAILADDRESS
      #---------------------------------------------------------------------
      # LOGOUT_WITH_TIMER : Enables or not the option logout with timer
      # example : LOGOUT_WITH_TIMER=true
      #export LOGOUT_WITH_TIMER=
      # LOGOUT_IN : The number of days
      # example : LOGOUT_IN=1
      #export LOGOUT_IN=
      #export LOGOUT_ON_HOURS=
      # LOGOUT_ON_MINUTES : The number of minutes
      # example : LOGOUT_ON_MINUTES=55
      #export LOGOUT_ON_MINUTES=
      #---------------------------------------------------------------------
      # PASSWORD_LOGIN_ENABLED : Enable or not the password login form.
      #export PASSWORD_LOGIN_ENABLED=true
      #---------------------------------------------------------------------
      #export CAS_ENABLED=true
      #export CAS_BASE_URL=https://cas.example.com/cas
      #export CAS_LOGIN_URL=https://cas.example.com/login
      #export CAS_VALIDATE_URL=https://cas.example.com/cas/p3/serviceValidate
      #---------------------------------------------------------------------
      #export SAML_ENABLED=true
      #export SAML_PROVIDER=
      #export SAML_ENTRYPOINT=
      #export SAML_ISSUER=
      #export SAML_CERT=
      #export SAML_IDPSLO_REDIRECTURL=
      #export SAML_PRIVATE_KEYFILE=
      #export SAML_PUBLIC_CERTFILE=
      #export SAML_IDENTIFIER_FORMAT=
      #export SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE=
      #export SAML_ATTRIBUTES=
      #---------------------------------------------------------------------
      # Wait spinner to use
      #export WAIT_SPINNER=Bounce
      #---------------------------------------------------------------------

      node main.js & >> ~/repos/wekan.log
      cd ~/repos
#done
