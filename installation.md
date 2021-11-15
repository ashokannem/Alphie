# Alphie

Alphie is a self-hosted support and ticketing system built for Firebase on Angular.

## Getting Started

Getting Alphie up and running is outlined below. 

### **Setup your Google Firebase account**
 - [ ] If you don't already have one, create one at `https://firebase.google.com`
 - [ ] Then create a new project naming it anything you like
	 - [ ] Create a web app and save the `firebaseConfig` script for later.
	 - [ ] Enable pay as you go billing under the "Blaze" plan.
	 - [ ] Create your Firestore Database and set your location.
		 - [ ] Begin in **production mode**, we'll update rules at a later time.
	 - [ ] Enable your preferred authentication Sign-In methods.
		 - [ ] The available methods for Alphie are currently **Email/Password** & **Google**.

### **Setup your SendGrid account**

 - [ ] If you don't already have one, create one at `https://sendgrid.com`
 - [ ] Then create an API Key and save it for later.
 - [ ] Setup your **Sender Identity** for **Domain Authentication**.

### **Download Alphie**

    cd your-preferred-project-directory
    git clone https://github.com/ETMitch21/Alphie.git
    cd Alphie
    
### **Setup Environment**

 **Create the environments folder and files.**

    mkdir src/environments // Creates the environments folder
    cd src/environments // Move into the environments folder
    touch environment.ts // Create the development file
    touch environment.prod.ts // Create the production file
    
*Note: If you are not customizing, you may skip creating the environment.ts file. You must still create the environment.prod.ts file.*

 **Add the following code into each of the environment files created above.**

    export const environment = {
        production: true, // This should be set to false in environment.ts.
        firebase: { // Replace this with your config from Firebase
			projectId: '',
			appId: '',
			storageBucket: '',
			locationId: '',
			apiKey: '',
			authDomain: '',
			messagingSenderId: '',
		},
        appConfig: {
    		allowGoogleLogin: true,
    		lockGoogleLoginToDomain: true,
    		emailDomain: 'example.com',
    		supportName: 'Alphie Support',
    		supportEmail: 'help@example.com',
    		title: 'Alphie',
    		logoIcon: 'fas fa-laugh-wink
    	}
    }

**Install Node Modules**

    cd your-preferred-project-directory/Alphie
    npm install

**Initialize Firebase**

    firebase init
    Select the following features:
	    Firestore
	    Functions
	    Hosting
	    Storage
    Select use an existing project
	    Select the project we created earlier
	DO NOT OVERWRITE OR REPLACE ANY FILES. LEAVE ALL DEFAULT FILE NAMES.
	Install dependencies
	What do you want to use as your public directory? 
		dist/alphie
	Configure as a single-page app?
		yes
	Set up automatic builds and deploys with GitHub?
		no

**Setup Firebase Functions Config**

    cd your-preferred-project-directory/Alphie
    firebase functions:config:set sendgrid.key='your-sendgrid-api-key'
    firebase functions:config:set app_config.title='' app_config.support_email='' app_config.email_domain='' app_config.support_name='' app_config.interface_domain=''

**Config Variable Explanations**
|Element| Value |
|--|--|
| sendgrid.key | Your sendgrid API Key |
| app_config.title | The title of your support app "Alphie"
| app_config.support_email | The email address you will use to provide support to your customers.
| app_config.email_domain | The domain name that users emails will need to be assigned so they may register for access to the admin panel.
| app_config.support_name | The name that will appear in emails, Commonly your company name.
app_config.interface_domain | The domain you and your users will visit to access your admin panel.

### **Build the project**

    cd your-preferred-project-directory/Alphie
    ng build

### **Deploy the project**

    cd your-preferred-project-directory/Alphie
    firebase deploy

### **Setup Inbound Email Parse**

 - [ ] Login to your Sendgrid account at `https://app.sendgrid.com`.
 - [ ] Navigate to `Settings > Inbound Parse`.
 - [ ] Click `Add Host & URL`.
 - [ ] Under Receiving Domain select your authenticated domain you created earlier and enter a subdomain if needed.
	 - [ ] **Keep in mind**, any email sent to this address will be parsed. Add a subdomain to ensure only those emails are parsed or use a dedicated domain name for support emails.
 - [ ] Under Destination URL enter your Firebase Cloud Functions url for the `incomingEmail` function.
	 - [ ] You can find this in your Firebase console under functions. 
	 - [ ] It will look something like, `https://us-central1-example-projectID.cloudfunctions.net/incomingEmail` where example-projectID is your Firebase project ID.
 - [ ] Select `Check incoming emails for spam` to prevent unwanted tickets from being created. 
 - [ ] Leave `POST the raw, full MIME message` unchecked.
 - [ ] Click Add

### **Setup the interface domain**

 - [ ] Navigate to the console for your Firebase project.
 - [ ] Go to Hosting
 - [ ] Select `Add custom domain`
 - [ ] Enter the same domain name entered earlier for `app_config.interface_domain`
 - [ ] Click Continue
 - [ ] Follow the steps required to verify and direct your domain to your project.
	 - [ ] This will require you to add records with your DNS provider or registrar. 
	 - [ ] Reach out to them for specific instructions on how to add the required records.

### **Setup Initial User**

 - [ ] Navigate to the console for your Firebase project.
 - [ ] Go to Authentication
 - [ ] Click Add user
 - [ ] Enter your email address
 - [ ] Enter a password
 - [ ] Select Add user

    
### **Installation Complete**

Congrats! You have installed Alphie! Now get to ticketing by visiting your interface domain on any browser.