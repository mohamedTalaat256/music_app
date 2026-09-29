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
            }
            steps {
                sh '''
                node --version
                npm --version

                # Fixed: Explicitly declare the firebase-tools package using npx
                npx --package=firebase-tools firebase deploy --only hosting --project ${FIREBASE_PROJECT_ID}
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
