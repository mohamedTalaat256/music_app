pipeline {
    agent any

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                    // This forces Docker to use Jenkins user permissions
                    args '-u 1000:1000'
                }
            }
            steps {
              sh '''
                node --version
                npm install -g @angular/cli
                npm install
                ng build --configuration production --base-href ./
              '''
            }
        }
    }
}
