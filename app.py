from flask import Flask, render_template, request, jsonify
import numpy as np
import pickle

app = Flask(__name__)

@app.route('/', methods=["GET"])
def home():
    return render_template('index.html')


@app.route('/prediction', methods=["POST"])
def prediction():
    keys = list(request.form.keys())
    data = eval(keys[0])   ## To convert JSON string to dictionary

    imgText = data['imageData']

    arr = np.array([int(i) for i in imgText])
    ## nx = new example given by user
    nx = np.array([arr])

    clf = None
    f_handle = None
    if (data['classifier'] == 'Perceptron'):
        f_handle = open('estimators/perceptron.pkl', 'rb')
        clf = pickle.load(f_handle)
    # elif (data['classifier'] == 'Softmax Regression'):
        # f_handle = open(os.getcwd() + '\\estimators\\perceptron.pkl', 'rb')
    #     clf = pickle.load(open(os.getcwd() + '\\estimators\\softmax_old.pkl', 'rb'))
    elif (data['classifier'] == 'RandomForest'):
        f_handle = open('estimators/randomForest.pkl', 'rb')
        clf = pickle.load(f_handle)
    else:
        f_handle = open('estimators/sgdclassifier.pkl', 'rb')
        clf = pickle.load(f_handle)

    try:   ## Closing the file after importing estimator
        f_handle.close()
    except:
        pass

    pred = str(clf.predict(nx)[0])

    res = jsonify(prediction=pred)
    return res


if __name__ == '__main__':
    app.run()