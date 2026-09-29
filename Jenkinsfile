pipeline {
    agent any
    environment {
        FIREBASE_TOKEN      = credentials('FIREBASE_TOKEN')
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
                HOME = "${WORKSPACE}"
            }
            steps {
                sh '''
                node --version
                npm --version
                npm ci
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
                // Forces the container layer to inherit the global credential variable
                FIREBASE_TOKEN = "${FIREBASE_TOKEN}"
            }
            steps {
                sh '''
                node --version
                npm --version

                # Fixed: Explicitly pass the token using the --token flag to guarantee container authentication
                npx --package=firebase-tools firebase deploy --only hosting --project ${FIREBASE_PROJECT_ID} --token "${FIREBASE_TOKEN}"
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
