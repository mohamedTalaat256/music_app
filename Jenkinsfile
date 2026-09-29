pipeline {
    agent any
    environment {
        // Defines the credential globally so both Build and Deploy stages can access it
        FIREBASE_TOKEN = credentials('FIREBASE_TOKEN')
        FIREBASE_PROJECT_ID = 'music-app-67e7d'
    }
    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            environment {
                // Creates a writable space for npm caching inside the container workspace
                HOME = "${WORKSPACE}"
            }
            steps {
                sh '''
                node --version
                npm --version
                # Install dependencies locally
                npm ci
                # Run the build using npx to use the local Angular CLI
                npx ng build --configuration production --base-href ./
                '''
            }
        }
        stage('Deploy') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            environment {
                HOME = "${WORKSPACE}"
            }
            steps {
                sh '''
                node --version
                npm --version

                # Deploy to Firebase using your explicit Firebase Project ID
                # Replace 'your-firebase-project-id' with your actual Firebase project ID
                npx firebase deploy --only hosting --project ${FIREBASE_PROJECT_ID}
                '''
            }
        }
    }
    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo 'Angular application successfully deployed to Firebase Hosting!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
