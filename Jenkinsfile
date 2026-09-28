pipeline {
    agent any

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
                // Creates a writable space for npm caching inside the container workspace
                HOME = "${WORKSPACE}"
            }
            steps {
                sh '''
                    npm install netlify-cli -g
                    netlify --version

                '''
            }
        }
    }
}
